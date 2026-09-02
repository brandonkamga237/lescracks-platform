package com.brandonkamga.lescracks.service;

import com.brandonkamga.lescracks.domain.Application;
import com.brandonkamga.lescracks.domain.ApplicationStatus;
import com.brandonkamga.lescracks.domain.Attestation;
import com.brandonkamga.lescracks.domain.EnrolmentTarget;
import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.EventKind;
import com.brandonkamga.lescracks.domain.Participation;
import com.brandonkamga.lescracks.domain.ParticipationStatus;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.ApplicationRepository;
import com.brandonkamga.lescracks.repository.AttestationRepository;
import com.brandonkamga.lescracks.repository.EventRepository;
import com.brandonkamga.lescracks.repository.ParticipationRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.interfaces.ApplicationService;
import com.brandonkamga.lescracks.service.interfaces.ApplicationService.ApplicationDraft;
import com.brandonkamga.lescracks.service.interfaces.MentorshipService;
import com.brandonkamga.lescracks.service.interfaces.ParticipationService;
import com.brandonkamga.lescracks.support.PostgresIT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * An attestation is the one thing this platform produces that outlives it: a code somebody
 * puts on a CV, that a stranger checks years later. So the tests here are less about the
 * happy path than about never issuing two codes for one achievement, and never issuing one
 * that names nobody.
 */
@Transactional
class ParticipationServiceIT extends PostgresIT {

    @Autowired
    ParticipationService service;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    MentorshipService mentorship;

    @Autowired
    ParticipationRepository participations;

    @Autowired
    ApplicationRepository applications;

    @Autowired
    AttestationRepository attestations;

    @Autowired
    EventRepository events;

    @Autowired
    UserRepository users;

    private Long adaId;
    private Long eventId;

    @BeforeEach
    void fixture() {
        participations.deleteAll();
        applications.deleteAll();
        events.deleteAll();
        users.deleteAll();

        adaId = users.save(User.builder()
                .subject("kc-ada").email("ada@lescracks.test").displayName("Ada Lovelace").build()).getId();
        eventId = events.save(Event.builder()
                .kind(EventKind.BOOTCAMP).slug("bootcamp").title("Bootcamp Spring")
                .startsAt(Instant.now().plus(5, ChronoUnit.DAYS))
                .published(true).build()).getId();
        mentorship.setOpen(true);
    }

    @Test
    @DisplayName("an accepted application becomes a participation")
    void turnsAnAcceptedApplicationIntoAParticipation() {
        Application application = applicationService.apply(new ApplicationDraft(
                EnrolmentTarget.MENTORSHIP, null, "Ada Lovelace", "ada@lescracks.test", null, "Motivée"));
        applicationService.decide(application.getId(), ApplicationStatus.ACCEPTED);

        Participation participation = service.fromApplication(application.getId(), "2026-A", null);

        assertThat(participation.getStatus()).isEqualTo(ParticipationStatus.IN_PROGRESS);
        assertThat(participation.getUser().getId()).isEqualTo(adaId);
        assertThat(participation.getStartedAt()).isEqualTo(LocalDate.now());
    }

    @Test
    @DisplayName("the same application cannot be turned into two participations")
    void refusesToEnrolTheSameApplicationTwice() {
        Application application = applicationService.apply(new ApplicationDraft(
                EnrolmentTarget.MENTORSHIP, null, "Ada", "ada@lescracks.test", null, null));
        service.fromApplication(application.getId(), null, null);

        assertThatThrownBy(() -> service.fromApplication(application.getId(), null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("déjà donné lieu");
    }

    @Test
    @DisplayName("an application with no account behind it cannot be enrolled")
    void refusesAnApplicationWithoutAnAccount() {
        Application orphan = applicationService.apply(new ApplicationDraft(
                EnrolmentTarget.MENTORSHIP, null, "Grace", "grace@lescracks.test", null, null));

        // An attestation names a person; there is nobody to name here.
        assertThatThrownBy(() -> service.fromApplication(orphan.getId(), null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("grace@lescracks.test");
    }

    @Test
    @DisplayName("nobody follows the same programme twice at once")
    void refusesASecondActiveParticipation() {
        service.create(adaId, null, null, null);

        assertThatThrownBy(() -> service.create(adaId, null, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("suit déjà");
    }

    @Test
    @DisplayName("but abandoning frees the place")
    void allowsRestartingAfterAbandoning() {
        Participation first = service.create(adaId, null, null, null);
        service.abandon(first.getId());

        assertThat(service.create(adaId, null, null, null).getId()).isNotNull();
    }

    @Test
    @DisplayName("the 360 and an event are separate commitments")
    void theTwoTargetsDoNotCollide() {
        service.create(adaId, null, null, null);

        assertThat(service.create(adaId, eventId, null, null).getTarget())
                .isEqualTo(EnrolmentTarget.EVENT);
    }

    @Test
    @DisplayName("completing issues an attestation and dates the participation")
    void completingIssuesAnAttestation() {
        Participation participation = service.create(adaId, null, null, null);

        Attestation attestation = service.complete(participation.getId(), LocalDate.of(2026, 6, 1));

        assertThat(attestation.getCode()).startsWith("LC-" + Year.now() + "-");
        assertThat(service.require(participation.getId()).getStatus())
                .isEqualTo(ParticipationStatus.COMPLETED);
        assertThat(service.require(participation.getId()).getCompletedAt())
                .isEqualTo(LocalDate.of(2026, 6, 1));
    }

    @Test
    @DisplayName("completing twice returns the code already issued, never a second one")
    void doesNotIssueASecondCode() {
        Participation participation = service.create(adaId, null, null, null);
        Attestation first = service.complete(participation.getId(), LocalDate.now());

        Attestation again = service.complete(participation.getId(), LocalDate.now());

        // The first code may already be on a CV; replacing it would invalidate it silently.
        assertThat(again.getCode()).isEqualTo(first.getCode());
        assertThat(attestations.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("two attestations never share a code")
    void codesAreUnique() {
        Participation onProgramme = service.create(adaId, null, null, null);
        Participation onEvent = service.create(adaId, eventId, null, null);

        String first = service.complete(onProgramme.getId(), LocalDate.now()).getCode();
        String second = service.complete(onEvent.getId(), LocalDate.now()).getCode();

        assertThat(first).isNotEqualTo(second);
    }

    @Test
    @DisplayName("anyone may check a code, and a wrong one simply finds nothing")
    void verifiesACodeWithoutAnAccount() {
        Participation participation = service.create(adaId, null, null, null);
        String code = service.complete(participation.getId(), LocalDate.now()).getCode();

        assertThat(service.verify(code)).isPresent();
        assertThat(service.verify("LC-2026-INVENTE")).isEmpty();
    }

    @Test
    @DisplayName("abandoning keeps the row and clears the completion date")
    void abandoningKeepsTheRecord() {
        Participation participation = service.create(adaId, null, null, null);

        service.abandon(participation.getId());

        Participation reloaded = service.require(participation.getId());
        assertThat(reloaded.getStatus()).isEqualTo(ParticipationStatus.ABANDONED);
        assertThat(reloaded.getCompletedAt()).isNull();
        assertThat(participations.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("a participation that does not exist is not found")
    void refusesAnUnknownParticipation() {
        assertThatThrownBy(() -> service.require(999_999L)).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.complete(999_999L, null)).isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("a user's participations are listed, and someone else's are not")
    void listsWhatBelongsToTheUser() {
        service.create(adaId, null, null, null);
        Long grace = users.save(User.builder()
                .subject("kc-grace").email("grace@lescracks.test").displayName("Grace").build()).getId();

        assertThat(service.forUser(adaId)).hasSize(1);
        assertThat(service.forUser(grace)).isEmpty();
    }

    @Test
    @DisplayName("the public counters count what was finished, not what was started")
    void proofOfWorkCountsCompletions() {
        Participation finished = service.create(adaId, null, null, null);
        service.complete(finished.getId(), LocalDate.now());
        service.create(adaId, eventId, null, null);

        var counters = service.proofOfWork();

        assertThat(counters.get("completed")).isEqualTo(1L);
        assertThat(counters.get("inProgress")).isEqualTo(1L);
    }

    @Test
    @DisplayName("listing by status separates the finished from the rest")
    void listsByStatus() {
        Participation finished = service.create(adaId, null, null, null);
        service.complete(finished.getId(), LocalDate.now());
        service.create(adaId, eventId, null, null);

        assertThat(service.byStatus(ParticipationStatus.COMPLETED, PageRequest.of(0, 10))).hasSize(1);
        assertThat(service.byStatus(ParticipationStatus.IN_PROGRESS, PageRequest.of(0, 10))).hasSize(1);
        assertThat(service.all(PageRequest.of(0, 10))).hasSize(2);
    }
}
