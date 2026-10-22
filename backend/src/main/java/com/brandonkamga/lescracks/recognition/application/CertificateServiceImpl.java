package com.brandonkamga.lescracks.recognition.application;

import com.brandonkamga.lescracks.recognition.domain.model.Certificate;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateCodes;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateIssued;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateKind;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateWording;
import com.brandonkamga.lescracks.recognition.domain.port.CertificateStore;
import com.brandonkamga.lescracks.recognition.domain.port.RecognitionEvents;
import com.brandonkamga.lescracks.event.application.EventDirectory;
import com.brandonkamga.lescracks.event.application.RegistrationService;
import com.brandonkamga.lescracks.event.application.SubmissionService;
import com.brandonkamga.lescracks.event.application.SubmissionView;
import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.RegistrationStatus;
import com.brandonkamga.lescracks.event.domain.model.SubmissionStatus;
import com.brandonkamga.lescracks.mail.domain.CertificateIssuedEmail;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class CertificateServiceImpl implements CertificateService {
    private static final Logger log = LoggerFactory.getLogger(CertificateServiceImpl.class);

    private final CertificateStore certificates;
    private final EventDirectory events;
    private final RegistrationService registrations;
    private final SubmissionService submissions;
    private final MemberDirectory people;
    private final Mailer mailer;
    private final RecognitionEvents published;

    public CertificateServiceImpl(CertificateStore certificates, EventDirectory events, RegistrationService registrations,
                                  SubmissionService submissions, MemberDirectory people, Mailer mailer, RecognitionEvents published) {
        this.certificates = certificates;
        this.events = events;
        this.registrations = registrations;
        this.submissions = submissions;
        this.people = people;
        this.mailer = mailer;
        this.published = published;
    }

    private record Recognised(Member holder, CertificateKind kind, Integer rank, String detail) {
    }

    @Override
    public List<CertificateView> prepare(Long eventId) {
        Event event = events.require(eventId);
        List<Recognised> recognised = new ArrayList<>();
        if (event.isAcceptsSubmissions()) {
            for (SubmissionView view : submissions.listForEvent(eventId)) {
                if (view.submission().getStatus() == SubmissionStatus.REJECTED) continue;
                Integer rank = view.submission().getRank();
                String project = "Projet « " + view.submission().getTitle() + " »";
                for (Member member : view.team()) {
                    recognised.add(new Recognised(member, CertificateKind.PARTICIPATION, null, project));
                    if (rank != null && rank == 1) recognised.add(new Recognised(member, CertificateKind.WINNER, rank, project));
                    else if (rank != null && rank <= 3) recognised.add(new Recognised(member, CertificateKind.PODIUM, rank, project));
                }
            }
        } else {
            registrations.listForEvent(eventId).stream()
                    .filter(view -> view.registration().getStatus() == RegistrationStatus.ATTENDED)
                    .forEach(view -> recognised.add(new Recognised(view.member(), CertificateKind.PARTICIPATION, null, null)));
        }
        // Codes are not checked one by one: 10^14 combinations make a clash negligible, and the
        // unique constraint would still refuse one.
        int added = certificates.addDrafts(recognised.stream().map(entry -> Certificate.builder()
                .code(CertificateCodes.next()).userId(entry.holder().getId()).eventId(eventId).kind(entry.kind())
                .holderName(fullName(entry.holder())).title(CertificateWording.of(entry.kind(), event, entry.rank()))
                .detail(entry.detail()).eventDate(event.getStartDate()).build()).toList());
        log.info("{} attestation drafts prepared for event {}", added, eventId);
        return listForEvent(eventId);
    }

    @Override
    public List<CertificateView> listForEvent(Long eventId) {
        List<Certificate> list = certificates.findByEvent(eventId);
        Map<Long, Member> holders = people.findAll(list.stream().map(Certificate::getUserId).toList());
        return list.stream().map(certificate -> new CertificateView(certificate,
                holders.containsKey(certificate.getUserId()) ? holders.get(certificate.getUserId()).getEmail() : null)).toList();
    }

    @Override
    public List<Certificate> issue(Collection<Long> ids) {
        List<Certificate> drafts = certificates.findAllById(ids).stream().filter(Certificate::isDraft).toList();
        Map<Long, Member> holders = people.findAll(drafts.stream().map(Certificate::getUserId).toList());
        Instant now = Instant.now();
        List<Certificate> issued = new ArrayList<>();
        for (Certificate certificate : drafts) {
            Member holder = holders.get(certificate.getUserId());
            if (holder == null) continue;
            certificate.issue(fullName(holder), now);
            issued.add(certificate);
        }
        certificates.saveAll(issued);
        for (Certificate certificate : issued) {
            Member holder = holders.get(certificate.getUserId());
            mailer.send(new CertificateIssuedEmail(holder.getEmail(), holder.getFirstName(), certificate.getTitle(), certificate.getCode()));
            published.issued(new CertificateIssued(holder.getId(), certificate.getKind(), certificate.getEventId()));
        }
        log.info("{} attestations issued", issued.size());
        return issued;
    }

    @Override
    public Certificate revoke(Long id) {
        Certificate certificate = require(id);
        certificate.revoke();
        certificates.saveAll(List.of(certificate));
        log.info("Attestation {} revoked", certificate.getCode());
        return certificate;
    }

    @Override
    public void discard(Long id) {
        require(id).checkDiscardable();
        certificates.delete(id);
    }

    @Override
    public Certificate verify(String code) {
        String normalized = code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
        return certificates.findByCode(normalized).filter(certificate -> !certificate.isDraft())
                .orElseThrow(() -> new NotFoundException("Attestation", "code", normalized));
    }

    @Override
    public List<Certificate> listMine(String email) {
        return certificates.findIssuedTo(people.require(email).getId());
    }

    @Override
    public List<Certificate> listIssuedTo(Long userId) {
        return certificates.findIssuedTo(userId);
    }

    private Certificate require(Long id) {
        return certificates.findById(id).orElseThrow(() -> new NotFoundException("Attestation", "id", id));
    }

    private static String fullName(Member user) {
        String name = ((user.getFirstName() == null ? "" : user.getFirstName()) + " " + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return name.isEmpty() ? user.getEmail() : name;
    }
}
