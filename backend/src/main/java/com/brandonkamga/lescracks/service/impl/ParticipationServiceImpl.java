package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.*;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.repository.*;
import com.brandonkamga.lescracks.service.interfaces.ParticipationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Year;
import java.util.*;

@Service
@Transactional
public class ParticipationServiceImpl implements ParticipationService {

    private static final Logger log = LoggerFactory.getLogger(ParticipationServiceImpl.class);

    private final ParticipationRepository participationRepository;
    private final AttestationRepository attestationRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;

    public ParticipationServiceImpl(ParticipationRepository participationRepository,
                                    AttestationRepository attestationRepository,
                                    ApplicationRepository applicationRepository,
                                    UserRepository userRepository,
                                    EventRepository eventRepository) {
        this.participationRepository = participationRepository;
        this.attestationRepository = attestationRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
    }

    @Override
    public Participation acceptApplication(Long applicationId, String cohort, LocalDate startedAt) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", applicationId));

        participationRepository.findByApplicationId(applicationId).ifPresent(existing -> {
            throw new BadRequestException("Cette candidature a déjà été acceptée.");
        });

        User user = application.getUser();
        if (user == null) {
            // Applications can be filed without an account; a participation cannot exist without one.
            throw new BadRequestException(
                    "Cette candidature n'est rattachée à aucun compte. "
                            + "La personne doit en créer un avant d'être inscrite au programme.");
        }

        Participation participation = build(user, application.getEvent(), cohort, startedAt);
        participation.setApplication(application);
        return participationRepository.save(participation);
    }

    @Override
    public Participation create(Long userId, Long eventId, String cohort, LocalDate startedAt) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Event event = eventId == null ? null : eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        return participationRepository.save(build(user, event, cohort, startedAt));
    }

    private Participation build(User user, Event event, String cohort, LocalDate startedAt) {
        if (event != null && participationRepository.existsByUserIdAndEventId(user.getId(), event.getId())) {
            throw new BadRequestException("Cette personne est déjà inscrite à ce programme.");
        }
        return Participation.builder()
                .user(user)
                .event(event)
                .cohort(cohort)
                .startedAt(startedAt != null ? startedAt : LocalDate.now())
                .status(ParticipationStatus.IN_PROGRESS)
                .build();
    }

    @Override
    public Attestation complete(Long participationId, LocalDate completedOn) {
        Participation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new ResourceNotFoundException("Participation", "id", participationId));

        // Validating twice must not mint a second code: the first one is already out there,
        // possibly printed on a CV.
        if (participation.getAttestation() != null) {
            return participation.getAttestation();
        }

        participation.complete(completedOn);

        Attestation attestation = Attestation.builder()
                .participation(participation)
                .code(newCode())
                .build();
        participation.setAttestation(attestation);
        participationRepository.save(participation);

        log.info("Attestation {} issued for participation {} ({})",
                attestation.getCode(), participationId, participation.programmeLabel());
        return attestation;
    }

    /**
     * Readable enough to be typed from a printed page, random enough not to be guessed by
     * walking from one code to the next.
     */
    private String newCode() {
        for (int attempt = 0; attempt < 5; attempt++) {
            String candidate = "LC-" + Year.now().getValue() + "-"
                    + UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase(Locale.ROOT);
            if (!attestationRepository.existsByCode(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not allocate a free attestation code");
    }

    @Override
    public void abandon(Long participationId) {
        Participation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new ResourceNotFoundException("Participation", "id", participationId));
        if (participation.getAttestation() != null) {
            throw new BadRequestException(
                    "Une attestation a déjà été délivrée pour cette participation. "
                            + "Elle ne peut plus être marquée comme abandonnée.");
        }
        participation.abandon();
        participationRepository.save(participation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Participation> findByUser(Long userId) {
        return participationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Participation> findAll(Pageable pageable) {
        return participationRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Participation> findById(Long id) {
        return participationRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Attestation> verify(String code) {
        return code == null || code.isBlank()
                ? Optional.empty()
                : attestationRepository.findByCode(code.trim().toUpperCase(Locale.ROOT));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> proofOfWork() {
        Map<String, Long> byProgramme = new LinkedHashMap<>();
        for (Object[] row : participationRepository.countCompletedByProgramme()) {
            byProgramme.put((String) row[0], (Long) row[1]);
        }
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("peopleHelped", participationRepository.countDistinctCompletedParticipants());
        stats.put("completed", participationRepository.countByStatus(ParticipationStatus.COMPLETED));
        stats.put("inProgress", participationRepository.countByStatus(ParticipationStatus.IN_PROGRESS));
        stats.put("byProgramme", byProgramme);
        return stats;
    }
}
