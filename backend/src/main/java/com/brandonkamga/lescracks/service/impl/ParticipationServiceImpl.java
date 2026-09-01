package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.*;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.AttestationRepository;
import com.brandonkamga.lescracks.repository.ParticipationRepository;
import com.brandonkamga.lescracks.service.interfaces.ApplicationService;
import com.brandonkamga.lescracks.service.interfaces.EventService;
import com.brandonkamga.lescracks.service.interfaces.ParticipationService;
import com.brandonkamga.lescracks.service.interfaces.UserService;
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

    /** Long enough that codes do not collide, short enough to read off a printed page. */
    private static final int CODE_LENGTH = 6;

    private final ParticipationRepository participations;
    private final AttestationRepository attestations;
    private final ApplicationService applications;
    private final UserService users;
    private final EventService events;

    public ParticipationServiceImpl(ParticipationRepository participations,
                                    AttestationRepository attestations,
                                    ApplicationService applications,
                                    UserService users, EventService events) {
        this.participations = participations;
        this.attestations = attestations;
        this.applications = applications;
        this.users = users;
        this.events = events;
    }

    @Override
    public Participation fromApplication(Long applicationId, String cohort, LocalDate startedAt) {
        Application application = applications.require(applicationId);

        participations.findByApplicationId(applicationId).ifPresent(already -> {
            throw new BadRequestException("Cette candidature a déjà donné lieu à une participation.");
        });
        if (application.getUser() == null) {
            // An attestation names a person, so it needs an account behind it.
            throw new BadRequestException(
                    "Cette candidature n'est rattachée à aucun compte. "
                            + "La personne doit en créer un avec l'adresse " + application.getEmail() + ".");
        }

        Participation participation = start(
                application.getUser(), application.getTarget(), application.getEvent(), cohort, startedAt);
        participation.setApplication(application);
        return participations.save(participation);
    }

    @Override
    public Participation create(Long userId, Long eventId, String cohort, LocalDate startedAt) {
        User user = users.require(userId);
        EnrolmentTarget target = eventId == null ? EnrolmentTarget.MENTORSHIP : EnrolmentTarget.EVENT;
        Event event = eventId == null ? null : events.require(eventId);
        return participations.save(start(user, target, event, cohort, startedAt));
    }

    /** One place that opens a participation, so both routes into it enforce the same rules. */
    private Participation start(User user, EnrolmentTarget target, Event event,
                                String cohort, LocalDate startedAt) {
        Long eventId = event == null ? null : event.getId();
        if (participations.hasActiveFor(user.getId(), target, eventId)) {
            throw new BadRequestException("Cette personne suit déjà ce programme.");
        }
        return Participation.builder()
                .user(user)
                .target(target)
                .event(event)
                .cohort(cohort)
                .startedAt(startedAt != null ? startedAt : LocalDate.now())
                .status(ParticipationStatus.IN_PROGRESS)
                .build();
    }

    @Override
    public Attestation complete(Long participationId, LocalDate completedOn) {
        Participation participation = require(participationId);

        // Issuing twice would put a second code on the same achievement, and the first may
        // already be on a CV. Returning what exists is the honest answer.
        if (participation.getAttestation() != null) {
            return participation.getAttestation();
        }

        participation.complete(completedOn);
        Attestation attestation = Attestation.builder()
                .participation(participation)
                .code(allocateCode())
                .build();
        participation.setAttestation(attestation);
        participations.save(participation);

        log.info("Attestation {} issued for participation {} ({})",
                attestation.getCode(), participationId, participation.label());
        return attestation;
    }

    /**
     * Readable when printed, not guessable in sequence. Retried rather than assumed unique,
     * because a collision would overwrite somebody else's proof.
     */
    private String allocateCode() {
        for (int attempt = 0; attempt < 5; attempt++) {
            String candidate = "LC-" + Year.now() + "-" + randomBlock();
            if (!attestations.existsByCode(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not allocate a free attestation code");
    }

    private String randomBlock() {
        return UUID.randomUUID().toString()
                .replace("-", "")
                .substring(0, CODE_LENGTH)
                .toUpperCase(Locale.ROOT);
    }

    @Override
    public void abandon(Long participationId) {
        Participation participation = require(participationId);
        if (participation.getAttestation() != null) {
            throw new BadRequestException(
                    "Une attestation a été délivrée pour cette participation ; elle ne peut plus être abandonnée.");
        }
        participation.abandon();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Participation> forUser(Long userId) {
        return participations.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Participation> byStatus(ParticipationStatus status, Pageable pageable) {
        return participations.findByStatusOrderByCreatedAtDesc(status, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Participation> all(Pageable pageable) {
        return participations.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Participation require(Long id) {
        return participations.findById(id)
                .orElseThrow(() -> new NotFoundException("Participation", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Attestation> verify(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        return attestations.findByCode(code.strip().toUpperCase(Locale.ROOT));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> proofOfWork() {
        Map<String, Long> byTarget = new LinkedHashMap<>();
        participations.countCompletedByTarget()
                .forEach(row -> byTarget.put((String) row[0], (Long) row[1]));

        return Map.of(
                "peopleHelped", participations.countPeopleHelped(),
                "completed", participations.countByStatus(ParticipationStatus.COMPLETED),
                "inProgress", participations.countByStatus(ParticipationStatus.IN_PROGRESS),
                "byProgramme", byTarget);
    }
}
