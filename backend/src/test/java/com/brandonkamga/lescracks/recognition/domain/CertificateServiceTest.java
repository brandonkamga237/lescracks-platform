package com.brandonkamga.lescracks.recognition.domain;

import com.brandonkamga.lescracks.event.domain.Event;
import com.brandonkamga.lescracks.event.domain.EventRegistration;
import com.brandonkamga.lescracks.event.domain.EventRegistrationService;
import com.brandonkamga.lescracks.event.domain.EventService;
import com.brandonkamga.lescracks.event.domain.EventSubmission;
import com.brandonkamga.lescracks.event.domain.EventSubmissionService;
import com.brandonkamga.lescracks.event.domain.EventType;
import com.brandonkamga.lescracks.event.domain.RegistrationStatus;
import com.brandonkamga.lescracks.event.domain.RegistrationView;
import com.brandonkamga.lescracks.event.domain.SubmissionStatus;
import com.brandonkamga.lescracks.event.domain.SubmissionView;
import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.identity.domain.member.UserDirectory;
import com.brandonkamga.lescracks.mail.domain.CertificateIssuedEmail;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.recognition.infra.CertificateRepository;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationEventPublisher;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CertificateServiceTest {

    @Mock private CertificateRepository certificates;
    @Mock private EventService events;
    @Mock private EventRegistrationService registrations;
    @Mock private EventSubmissionService submissions;
    @Mock private UserDirectory people;
    @Mock private Mailer mailer;
    @Mock private ApplicationEventPublisher published;

    private CertificateServiceImpl service;
    private final User awa = User.builder().id(1L).email("awa@example.com").firstName("Awa").lastName("Diallo").build();
    private final User kofi = User.builder().id(2L).email("kofi@example.com").firstName("Kofi").lastName("Mensah").build();
    private final User lina = User.builder().id(3L).email("lina@example.com").firstName("Lina").lastName("Moussa").build();

    @BeforeEach
    void setUp() {
        service = new CertificateServiceImpl(certificates, events, registrations, submissions, people, mailer, published);
        when(certificates.save(any())).thenAnswer(call -> call.getArgument(0));
        when(certificates.findByEventIdOrderByKindAscHolderNameAsc(any())).thenReturn(List.of());
    }

    private Event event(EventType type, boolean projects) {
        Event event = Event.builder().id(9L).title("Hackathon 001").type(type).acceptsSubmissions(projects).startDate(Instant.now()).build();
        when(events.require(9L)).thenReturn(event);
        return event;
    }

    private static SubmissionView project(SubmissionStatus status, Integer rank, User... team) {
        return new SubmissionView(EventSubmission.builder().title("Mondje").status(status).rank(rank).build(), List.of(team), null);
    }

    private List<Certificate> saved(int count) {
        ArgumentCaptor<Certificate> captor = ArgumentCaptor.forClass(Certificate.class);
        verify(certificates, times(count)).save(captor.capture());
        return captor.getAllValues();
    }

    @Test
    @DisplayName("a hackathon recognises every member of a kept project, and its winner twice")
    void preparesHackathonDrafts() {
        event(EventType.HACKATHON, true);
        when(submissions.forEvent(9L)).thenReturn(List.of(
                project(SubmissionStatus.ACCEPTED, 1, awa, kofi), project(SubmissionStatus.REJECTED, null, lina)));

        service.prepare(9L);

        List<Certificate> drafts = saved(4);
        assertThat(drafts).extracting(Certificate::getKind).containsExactly(
                CertificateKind.PARTICIPATION, CertificateKind.WINNER, CertificateKind.PARTICIPATION, CertificateKind.WINNER);
        assertThat(drafts.get(1).getTitle()).isEqualTo("a remporté le hackathon « Hackathon 001 »");
        assertThat(drafts).allMatch(draft -> draft.getStatus() == CertificateStatus.DRAFT && draft.getCode().length() == 10);
    }

    @Test
    @DisplayName("an event without projects recognises the people marked present, and preparing twice adds nothing")
    void preparesAttendanceDrafts() {
        event(EventType.WORKSHOP, false);
        when(registrations.forEvent(9L)).thenReturn(List.of(
                new RegistrationView(EventRegistration.builder().status(RegistrationStatus.ATTENDED).build(), awa),
                new RegistrationView(EventRegistration.builder().status(RegistrationStatus.ABSENT).build(), kofi)));
        when(certificates.existsByUserIdAndEventIdAndKind(1L, 9L, CertificateKind.PARTICIPATION)).thenReturn(false, true);

        service.prepare(9L);
        service.prepare(9L);

        assertThat(saved(1)).singleElement().satisfies(draft -> assertThat(draft.getTitle()).isEqualTo("a participé à l’atelier « Hackathon 001 »"));
    }

    @Test
    @DisplayName("issuing freezes the current name, emails the holder once and skips anything not a draft")
    void issuesDrafts() {
        Certificate draft = Certificate.builder().id(5L).userId(1L).code("ABCDEFGHJK").title("a participé").holderName("Old").build();
        Certificate issued = Certificate.builder().id(6L).userId(2L).code("MNPQRSTUVW").status(CertificateStatus.ISSUED).build();
        when(certificates.findAllById(List.of(5L, 6L))).thenReturn(List.of(draft, issued));
        when(people.findAll(any())).thenReturn(Map.of(1L, awa));

        service.issue(List.of(5L, 6L));

        assertThat(draft.getStatus()).isEqualTo(CertificateStatus.ISSUED);
        assertThat(draft.getHolderName()).isEqualTo("Awa Diallo");
        assertThat(draft.getIssuedAt()).isNotNull();
        verify(mailer, times(1)).send(new CertificateIssuedEmail("awa@example.com", "Awa", "a participé", "ABCDEFGHJK"));
        verify(published).publishEvent(new CertificateIssued(1L, null, null));
    }

    @Test
    @DisplayName("an issued attestation is revoked, never deleted; a draft is deleted, never revoked")
    void revokeAndDiscard() {
        Certificate draft = Certificate.builder().id(5L).status(CertificateStatus.DRAFT).build();
        Certificate issued = Certificate.builder().id(6L).code("X").status(CertificateStatus.ISSUED).build();
        when(certificates.findById(5L)).thenReturn(Optional.of(draft));
        when(certificates.findById(6L)).thenReturn(Optional.of(issued));

        assertThatThrownBy(() -> service.revoke(5L)).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.discard(6L)).isInstanceOf(BadRequestException.class);
        service.discard(5L);
        assertThat(service.revoke(6L).getStatus()).isEqualTo(CertificateStatus.REVOKED);
        verify(certificates).delete(draft);
    }

    @Test
    @DisplayName("verification reads codes in any case and never shows a draft")
    void verifies() {
        Certificate issued = Certificate.builder().code("ABCDEFGHJK").status(CertificateStatus.ISSUED).build();
        when(certificates.findByCode("ABCDEFGHJK")).thenReturn(Optional.of(issued));
        when(certificates.findByCode("DRAFTDRAFT")).thenReturn(Optional.of(Certificate.builder().status(CertificateStatus.DRAFT).build()));

        assertThat(service.verify(" abcdefghjk ")).isSameAs(issued);
        assertThatThrownBy(() -> service.verify("draftdraft")).isInstanceOf(NotFoundException.class);
        verify(mailer, never()).send(any());
    }
}
