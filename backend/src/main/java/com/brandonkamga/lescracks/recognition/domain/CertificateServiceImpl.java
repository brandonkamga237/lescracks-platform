package com.brandonkamga.lescracks.recognition.domain;

import com.brandonkamga.lescracks.event.domain.Event;
import com.brandonkamga.lescracks.event.domain.EventRegistrationService;
import com.brandonkamga.lescracks.event.domain.EventService;
import com.brandonkamga.lescracks.event.domain.EventSubmissionService;
import com.brandonkamga.lescracks.event.domain.RegistrationStatus;
import com.brandonkamga.lescracks.event.domain.SubmissionStatus;
import com.brandonkamga.lescracks.event.domain.SubmissionView;
import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.identity.domain.member.UserDirectory;
import com.brandonkamga.lescracks.mail.domain.CertificateIssuedEmail;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.recognition.infra.CertificateRepository;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Transactional
public class CertificateServiceImpl implements CertificateService {
    private static final Logger log = LoggerFactory.getLogger(CertificateServiceImpl.class);

    private final CertificateRepository certificates;
    private final EventService events;
    private final EventRegistrationService registrations;
    private final EventSubmissionService submissions;
    private final UserDirectory people;
    private final Mailer mailer;
    private final ApplicationEventPublisher published;

    public CertificateServiceImpl(CertificateRepository certificates, EventService events, EventRegistrationService registrations,
                                  EventSubmissionService submissions, UserDirectory people, Mailer mailer,
                                  ApplicationEventPublisher published) {
        this.certificates = certificates;
        this.events = events;
        this.registrations = registrations;
        this.submissions = submissions;
        this.people = people;
        this.mailer = mailer;
        this.published = published;
    }

    private record Draft(User holder, CertificateKind kind, Integer rank, String detail) {
    }

    @Override
    public List<CertificateView> prepare(Long eventId) {
        Event event = events.require(eventId);
        List<Draft> drafts = new ArrayList<>();
        if (event.isAcceptsSubmissions()) {
            for (SubmissionView view : submissions.forEvent(eventId)) {
                if (view.submission().getStatus() == SubmissionStatus.REJECTED) continue;
                Integer rank = view.submission().getRank();
                String project = "Projet « " + view.submission().getTitle() + " »";
                for (User member : view.team()) {
                    drafts.add(new Draft(member, CertificateKind.PARTICIPATION, null, project));
                    if (rank != null && rank == 1) drafts.add(new Draft(member, CertificateKind.WINNER, rank, project));
                    else if (rank != null && rank <= 3) drafts.add(new Draft(member, CertificateKind.PODIUM, rank, project));
                }
            }
        } else {
            registrations.forEvent(eventId).stream()
                    .filter(view -> view.registration().getStatus() == RegistrationStatus.ATTENDED)
                    .forEach(view -> drafts.add(new Draft(view.member(), CertificateKind.PARTICIPATION, null, null)));
        }
        int created = 0;
        for (Draft draft : drafts) {
            if (certificates.existsByUserIdAndEventIdAndKind(draft.holder().getId(), eventId, draft.kind())) continue;
            certificates.save(Certificate.builder()
                    .code(freshCode()).userId(draft.holder().getId()).eventId(eventId).kind(draft.kind())
                    .holderName(fullName(draft.holder())).title(CertificateWording.of(draft.kind(), event, draft.rank()))
                    .detail(draft.detail()).eventDate(event.getStartDate()).build());
            created++;
        }
        log.info("{} attestation drafts prepared for event {}", created, eventId);
        return forEvent(eventId);
    }

    private String freshCode() {
        String code;
        do code = CertificateCodes.next(); while (certificates.existsByCode(code));
        return code;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CertificateView> forEvent(Long eventId) {
        List<Certificate> list = certificates.findByEventIdOrderByKindAscHolderNameAsc(eventId);
        Map<Long, User> holders = people.findAll(list.stream().map(Certificate::getUserId).toList());
        return list.stream().map(certificate -> new CertificateView(certificate,
                holders.containsKey(certificate.getUserId()) ? holders.get(certificate.getUserId()).getEmail() : null)).toList();
    }

    @Override
    public List<Certificate> issue(Collection<Long> ids) {
        List<Certificate> drafts = certificates.findAllById(ids).stream()
                .filter(certificate -> certificate.getStatus() == CertificateStatus.DRAFT).toList();
        Map<Long, User> holders = people.findAll(drafts.stream().map(Certificate::getUserId).toList());
        Instant now = Instant.now();
        for (Certificate certificate : drafts) {
            User holder = holders.get(certificate.getUserId());
            if (holder == null) continue;
            // The name as it stands at issue time is the one the document keeps.
            certificate.setHolderName(fullName(holder));
            certificate.setStatus(CertificateStatus.ISSUED);
            certificate.setIssuedAt(now);
            mailer.send(new CertificateIssuedEmail(holder.getEmail(), holder.getFirstName(), certificate.getTitle(), certificate.getCode()));
            published.publishEvent(new CertificateIssued(holder.getId(), certificate.getKind(), certificate.getEventId()));
        }
        log.info("{} attestations issued", drafts.size());
        return drafts;
    }

    @Override
    public Certificate revoke(Long id) {
        Certificate certificate = require(id);
        if (certificate.getStatus() != CertificateStatus.ISSUED) throw new BadRequestException("Seule une attestation émise peut être révoquée.");
        certificate.setStatus(CertificateStatus.REVOKED);
        log.info("Attestation {} revoked", certificate.getCode());
        return certificate;
    }

    @Override
    public void discard(Long id) {
        Certificate certificate = require(id);
        if (certificate.getStatus() != CertificateStatus.DRAFT) throw new BadRequestException("Une attestation émise se révoque, elle ne se supprime pas.");
        certificates.delete(certificate);
    }

    @Override
    @Transactional(readOnly = true)
    public Certificate verify(String code) {
        String normalized = code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
        return certificates.findByCode(normalized)
                .filter(certificate -> certificate.getStatus() != CertificateStatus.DRAFT)
                .orElseThrow(() -> new NotFoundException("Attestation", "code", normalized));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Certificate> mine(String email) {
        return certificates.findByUserIdAndStatusOrderByIssuedAtDesc(people.require(email).getId(), CertificateStatus.ISSUED);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Certificate> issuedTo(Long userId) {
        return certificates.findByUserIdAndStatusOrderByIssuedAtDesc(userId, CertificateStatus.ISSUED);
    }

    private Certificate require(Long id) {
        return certificates.findById(id).orElseThrow(() -> new NotFoundException("Attestation", "id", id));
    }

    private static String fullName(User user) {
        String name = ((user.getFirstName() == null ? "" : user.getFirstName()) + " " + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return name.isEmpty() ? user.getEmail() : name;
    }
}
