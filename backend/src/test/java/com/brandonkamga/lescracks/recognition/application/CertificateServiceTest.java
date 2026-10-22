package com.brandonkamga.lescracks.recognition.application;

import com.brandonkamga.lescracks.event.application.EventDirectory;
import com.brandonkamga.lescracks.event.application.RegistrationService;
import com.brandonkamga.lescracks.event.application.RegistrationView;
import com.brandonkamga.lescracks.event.application.SubmissionService;
import com.brandonkamga.lescracks.event.application.SubmissionView;
import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventType;
import com.brandonkamga.lescracks.event.domain.model.Registration;
import com.brandonkamga.lescracks.event.domain.model.RegistrationStatus;
import com.brandonkamga.lescracks.event.domain.model.Submission;
import com.brandonkamga.lescracks.event.domain.model.SubmissionStatus;
import com.brandonkamga.lescracks.mail.domain.CertificateIssuedEmail;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.recognition.domain.model.Certificate;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateIssued;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateKind;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateStatus;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CertificateServiceTest {

    private final InMemoryRecognition.Certificates certificates = new InMemoryRecognition.Certificates();
    private final InMemoryRecognition.Events published = new InMemoryRecognition.Events();
    private final EventDirectory events = mock(EventDirectory.class);
    private final RegistrationService registrations = mock(RegistrationService.class);
    private final SubmissionService submissions = mock(SubmissionService.class);
    private final MemberDirectory people = mock(MemberDirectory.class);
    private final Mailer mailer = mock(Mailer.class);
    private final CertificateService service = new CertificateServiceImpl(certificates, events, registrations, submissions, people,
            mailer, published);

    private final Member awa = Member.builder().id(1L).email("awa@example.com").firstName("Awa").lastName("Diallo").build();
    private final Member kofi = Member.builder().id(2L).email("kofi@example.com").firstName("Kofi").lastName("Mensah").build();
    private final Member lina = Member.builder().id(3L).email("lina@example.com").firstName("Lina").lastName("Moussa").build();

    @BeforeEach
    void setUp() {
        when(people.findAll(any())).thenReturn(Map.of(1L, awa, 2L, kofi, 3L, lina));
    }

    private void event(EventType type, boolean projects) {
        when(events.require(9L)).thenReturn(Event.builder().id(9L).title("Hackathon 001").type(type).acceptsSubmissions(projects)
                .startDate(Instant.parse("2026-11-01T00:00:00Z")).build());
    }

    private static SubmissionView project(SubmissionStatus status, Integer rank, Member... team) {
        return new SubmissionView(Submission.builder().title("Mondje").status(status).rank(rank).build(), List.of(team), null);
    }

    @Test
    @DisplayName("a hackathon recognises every member of a kept project, its winner twice, and preparing again adds nothing")
    void preparesHackathonDrafts() {
        event(EventType.HACKATHON, true);
        when(submissions.listForEvent(9L)).thenReturn(List.of(
                project(SubmissionStatus.ACCEPTED, 1, awa, kofi), project(SubmissionStatus.REJECTED, null, lina)));

        List<CertificateView> views = service.prepare(9L);
        service.prepare(9L);

        assertThat(certificates.all()).hasSize(4).allSatisfy(draft -> {
            assertThat(draft.getStatus()).isEqualTo(CertificateStatus.DRAFT);
            assertThat(draft.getCode()).hasSize(10);
            assertThat(draft.getEventDate()).isEqualTo(Instant.parse("2026-11-01T00:00:00Z"));
        });
        assertThat(certificates.all()).filteredOn(draft -> draft.getKind() == CertificateKind.WINNER)
                .extracting(Certificate::getTitle).containsOnly("a remporté le hackathon « Hackathon 001 »");
        assertThat(views).extracting(CertificateView::email).contains("awa@example.com", "kofi@example.com");
    }

    @Test
    @DisplayName("an event without projects recognises the people marked present")
    void preparesAttendanceDrafts() {
        event(EventType.WORKSHOP, false);
        when(registrations.listForEvent(9L)).thenReturn(List.of(
                new RegistrationView(Registration.builder().status(RegistrationStatus.ATTENDED).build(), awa),
                new RegistrationView(Registration.builder().status(RegistrationStatus.ABSENT).build(), kofi)));

        service.prepare(9L);

        assertThat(certificates.all()).singleElement().satisfies(draft -> {
            assertThat(draft.getUserId()).isEqualTo(1L);
            assertThat(draft.getTitle()).isEqualTo("a participé à l’atelier « Hackathon 001 »");
        });
    }

    @Test
    @DisplayName("issuing freezes the current name, emails the holder once, tells the badge rules, and skips anything not a draft")
    void issuesDrafts() {
        Certificate draft = certificates.add(Certificate.builder().userId(1L).eventId(9L).kind(CertificateKind.PARTICIPATION)
                .code("ABCDEFGHJK").title("a participé").holderName("Old").build());
        Certificate issued = certificates.add(Certificate.builder().userId(2L).code("MNPQRSTUVW").title("t").holderName("Kofi")
                .status(CertificateStatus.ISSUED).build());

        service.issue(List.of(draft.getId(), issued.getId()));

        Certificate stored = certificates.findById(draft.getId()).orElseThrow();
        assertThat(stored.getStatus()).isEqualTo(CertificateStatus.ISSUED);
        assertThat(stored.getHolderName()).isEqualTo("Awa Diallo");
        assertThat(stored.getIssuedAt()).isNotNull();
        verify(mailer, times(1)).send(new CertificateIssuedEmail("awa@example.com", "Awa", "a participé", "ABCDEFGHJK"));
        assertThat(published.issued).containsExactly(new CertificateIssued(1L, CertificateKind.PARTICIPATION, 9L));
        assertThat(service.listIssuedTo(1L)).hasSize(1);
    }

    @Test
    @DisplayName("an issued attestation is revoked, never deleted; a draft is deleted, never revoked")
    void revokeAndDiscard() {
        Certificate draft = certificates.add(Certificate.builder().userId(1L).code("A").build());
        Certificate issued = certificates.add(Certificate.builder().userId(1L).code("B").status(CertificateStatus.ISSUED).build());

        assertThatThrownBy(() -> service.revoke(draft.getId())).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.discard(issued.getId())).isInstanceOf(BadRequestException.class);
        service.discard(draft.getId());
        service.revoke(issued.getId());

        assertThat(certificates.findById(draft.getId())).isEmpty();
        assertThat(certificates.findById(issued.getId())).get().extracting(Certificate::getStatus).isEqualTo(CertificateStatus.REVOKED);
    }

    @Test
    @DisplayName("verification reads codes in any case and never shows a draft")
    void verifies() {
        certificates.add(Certificate.builder().userId(1L).code("ABCDEFGHJK").status(CertificateStatus.ISSUED).build());
        certificates.add(Certificate.builder().userId(1L).code("DRAFTDRAFT").build());

        assertThat(service.verify(" abcdefghjk ").getCode()).isEqualTo("ABCDEFGHJK");
        assertThatThrownBy(() -> service.verify("draftdraft")).isInstanceOf(NotFoundException.class);
        verify(mailer, never()).send(any());
    }
}
