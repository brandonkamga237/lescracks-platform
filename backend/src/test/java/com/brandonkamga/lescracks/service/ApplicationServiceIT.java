package com.brandonkamga.lescracks.service;

import com.brandonkamga.lescracks.domain.Application;
import com.brandonkamga.lescracks.domain.ApplicationStatus;
import com.brandonkamga.lescracks.domain.EnrolmentTarget;
import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.EventKind;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.ApplicationRepository;
import com.brandonkamga.lescracks.repository.EventRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.interfaces.ApplicationService;
import com.brandonkamga.lescracks.service.interfaces.ApplicationService.ApplicationDraft;
import com.brandonkamga.lescracks.service.interfaces.MentorshipService;
import com.brandonkamga.lescracks.support.PostgresIT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Applying is the only thing a stranger can do to this platform, so it is the surface that
 * has to refuse politely rather than fail. Each test here checks the refusal carries a
 * sentence the applicant can act on, not just that something was thrown.
 */
@Transactional
class ApplicationServiceIT extends PostgresIT {

    @Autowired
    ApplicationService service;

    @Autowired
    MentorshipService mentorship;

    @Autowired
    ApplicationRepository applications;

    @Autowired
    EventRepository events;

    @Autowired
    UserRepository users;

    private Long upcomingEvent;
    private Long pastEvent;
    private Long draftEvent;

    @BeforeEach
    void fixture() {
        applications.deleteAll();
        events.deleteAll();
        users.deleteAll();

        upcomingEvent = events.save(event("bootcamp-a-venir", 10, true)).getId();
        pastEvent = events.save(event("bootcamp-passe", -10, true)).getId();
        draftEvent = events.save(event("bootcamp-brouillon", 10, false)).getId();
        mentorship.setOpen(true);
    }

    private static Event event(String slug, long daysFromNow, boolean published) {
        return Event.builder()
                .kind(EventKind.BOOTCAMP).slug(slug).title("Bootcamp " + slug)
                .startsAt(Instant.now().plus(daysFromNow, ChronoUnit.DAYS))
                .endsAt(Instant.now().plus(daysFromNow + 1, ChronoUnit.DAYS))
                .published(published)
                .build();
    }

    private static ApplicationDraft mentorshipDraft(String email) {
        return new ApplicationDraft(EnrolmentTarget.MENTORSHIP, null, "Ada Lovelace", email, null, "Je veux progresser");
    }

    private ApplicationDraft eventDraft(Long eventId, String email) {
        return new ApplicationDraft(EnrolmentTarget.EVENT, eventId, "Ada Lovelace", email, null, null);
    }

    @Test
    @DisplayName("a 360 application is accepted while the programme is open")
    void acceptsAMentorshipApplication() {
        Application saved = service.apply(mentorshipDraft("ada@lescracks.test"));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getStatus()).isEqualTo(ApplicationStatus.PENDING);
        assertThat(saved.getEvent()).isNull();
    }

    @Test
    @DisplayName("the address is normalised on the way in")
    void normalisesTheAddress() {
        Application saved = service.apply(mentorshipDraft("  ADA@LesCracks.TEST  "));

        assertThat(saved.getEmail()).isEqualTo("ada@lescracks.test");
        assertThat(saved.getFullName()).isEqualTo("Ada Lovelace");
    }

    @Test
    @DisplayName("a closed programme refuses in words, not by constraint")
    void refusesWhenTheProgrammeIsClosed() {
        mentorship.setOpen(false);

        assertThatThrownBy(() -> service.apply(mentorshipDraft("ada@lescracks.test")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("fermées");
    }

    @Test
    @DisplayName("a second pending application for the same address is refused")
    void refusesADuplicate() {
        service.apply(mentorshipDraft("ada@lescracks.test"));

        assertThatThrownBy(() -> service.apply(mentorshipDraft("ada@lescracks.test")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("déjà en cours");
    }

    @Test
    @DisplayName("changing the casing does not get around it")
    void refusesADuplicateInAnotherCasing() {
        service.apply(mentorshipDraft("ada@lescracks.test"));

        assertThatThrownBy(() -> service.apply(mentorshipDraft("ADA@LESCRACKS.TEST")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("déjà en cours");
    }

    @Test
    @DisplayName("nor does padding it with spaces")
    void refusesADuplicatePaddedWithSpaces() {
        service.apply(mentorshipDraft("ada@lescracks.test"));

        // The stored address is stripped, so the duplicate check must strip before asking or
        // it looks free and the database rejects it as a 500 instead of a sentence.
        assertThatThrownBy(() -> service.apply(mentorshipDraft("  ada@lescracks.test  ")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("déjà en cours");
    }

    @Test
    @DisplayName("once decided, the address is free again")
    void allowsReapplyingAfterADecision() {
        Application first = service.apply(mentorshipDraft("ada@lescracks.test"));
        service.decide(first.getId(), ApplicationStatus.REJECTED);

        assertThat(service.apply(mentorshipDraft("ada@lescracks.test")).getId()).isNotNull();
    }

    @Test
    @DisplayName("an existing account is attached without the applicant doing anything")
    void attachesAKnownAccount() {
        users.save(User.builder().subject("kc-1").email("ada@lescracks.test").displayName("Ada").build());

        assertThat(service.apply(mentorshipDraft("ADA@lescracks.test")).getUser()).isNotNull();
    }

    @Test
    @DisplayName("an unknown address leaves the application unattached rather than failing")
    void leavesAnUnknownAddressUnattached() {
        assertThat(service.apply(mentorshipDraft("inconnue@lescracks.test")).getUser()).isNull();
    }

    @Test
    @DisplayName("an event application needs an event")
    void refusesAnEventApplicationWithoutEvent() {
        assertThatThrownBy(() -> service.apply(eventDraft(null, "ada@lescracks.test")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("événement");
    }

    @Test
    @DisplayName("an unpublished event takes nobody")
    void refusesADraftEvent() {
        assertThatThrownBy(() -> service.apply(eventDraft(draftEvent, "ada@lescracks.test")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("n'accepte pas encore");
    }

    @Test
    @DisplayName("a finished event takes nobody either")
    void refusesAPastEvent() {
        assertThatThrownBy(() -> service.apply(eventDraft(pastEvent, "ada@lescracks.test")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("terminé");
    }

    @Test
    @DisplayName("an event that does not exist is not found, not a bad request")
    void refusesAnUnknownEvent() {
        assertThatThrownBy(() -> service.apply(eventDraft(999_999L, "ada@lescracks.test")))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("the same person may apply to an event and to the 360")
    void theTwoTargetsDoNotCollide() {
        service.apply(mentorshipDraft("ada@lescracks.test"));

        assertThat(service.apply(eventDraft(upcomingEvent, "ada@lescracks.test")).getId()).isNotNull();
    }

    @Test
    @DisplayName("a missing name or address is refused before anything is written")
    void refusesAnIncompleteDraft() {
        assertThatThrownBy(() -> service.apply(
                new ApplicationDraft(EnrolmentTarget.MENTORSHIP, null, "  ", "ada@lescracks.test", null, null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("nom");

        assertThatThrownBy(() -> service.apply(
                new ApplicationDraft(EnrolmentTarget.MENTORSHIP, null, "Ada", null, null, null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("email");

        assertThat(applications.count()).isZero();
    }

    @Test
    @DisplayName("deciding twice is refused: the first answer stands")
    void refusesASecondDecision() {
        Application application = service.apply(mentorshipDraft("ada@lescracks.test"));
        service.decide(application.getId(), ApplicationStatus.ACCEPTED);

        assertThatThrownBy(() -> service.decide(application.getId(), ApplicationStatus.REJECTED))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("déjà été traitée");
    }

    @Test
    @DisplayName("listing by status and by target reads what was written")
    void listsByStatusAndTarget() {
        service.apply(mentorshipDraft("ada@lescracks.test"));
        service.apply(eventDraft(upcomingEvent, "grace@lescracks.test"));

        assertThat(service.byStatus(ApplicationStatus.PENDING, PageRequest.of(0, 10))).hasSize(2);
        assertThat(service.byTarget(EnrolmentTarget.MENTORSHIP, PageRequest.of(0, 10))).hasSize(1);
        assertThat(service.byTarget(EnrolmentTarget.EVENT, PageRequest.of(0, 10))).hasSize(1);
    }
}
