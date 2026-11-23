package com.brandonkamga.lescracks.event.infra.persistence;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.event.domain.model.DueReminder;
import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventFormat;
import com.brandonkamga.lescracks.event.domain.model.EventStatus;
import com.brandonkamga.lescracks.event.domain.model.EventType;
import com.brandonkamga.lescracks.event.domain.model.Registration;
import com.brandonkamga.lescracks.event.domain.model.RegistrationStatus;
import com.brandonkamga.lescracks.event.domain.port.EventStore;
import com.brandonkamga.lescracks.event.domain.port.RegistrationStore;
import com.brandonkamga.lescracks.event.domain.port.ReminderStore;
import com.brandonkamga.lescracks.support.PostgresIT;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static com.brandonkamga.lescracks.event.domain.model.ReminderMoment.DAY_BEFORE;
import static com.brandonkamga.lescracks.event.domain.model.ReminderMoment.HOUR_BEFORE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

@Transactional
class JdbcReminderStoreIT extends PostgresIT {

    @Autowired private ReminderStore reminders;
    @Autowired private EventStore events;
    @Autowired private RegistrationStore registrations;
    @Autowired private AccountStore accounts;

    private final Instant now = Instant.parse("2030-03-10T12:00:00Z");
    private Long awa;
    private Long kofi;

    @BeforeEach
    void setUp() {
        awa = accounts.save(Account.builder().email("awa.reminder@example.com").firstName("Awa").lastName("D").passwordHash("h").build()).getId();
        kofi = accounts.save(Account.builder().email("kofi.reminder@example.com").firstName("Kofi").lastName("A").passwordHash("h").build()).getId();
    }

    private Event event(String slug, EventType type, EventStatus status, Instant start) {
        return events.save(Event.builder().slug(slug).title("Titre " + slug).description("D").type(type)
                .format(EventFormat.ONLINE).location("https://meet.example.com/" + slug).status(status).startDate(start).build());
    }

    private Long signUp(Event event, Long member, RegistrationStatus status) {
        return registrations.save(Registration.builder().eventId(event.getId()).userId(member).status(status).build()).getId();
    }

    @Test
    @DisplayName("from 24 h to 1 h before the start, the day-before reminder is due for members still signed up to a published rendez-vous")
    void dayBefore() {
        Event workshop = event("it-reminder-workshop", EventType.WORKSHOP, EventStatus.PUBLISHED, now.plus(5, ChronoUnit.HOURS));
        Long awaRegistration = signUp(workshop, awa, RegistrationStatus.REGISTERED);
        signUp(workshop, kofi, RegistrationStatus.CANCELLED);
        signUp(event("it-reminder-draft", EventType.WORKSHOP, EventStatus.DRAFT, now.plus(5, ChronoUnit.HOURS)), awa, RegistrationStatus.REGISTERED);
        signUp(event("it-reminder-hackathon", EventType.HACKATHON, EventStatus.PUBLISHED, now.plus(5, ChronoUnit.HOURS)), awa, RegistrationStatus.REGISTERED);
        signUp(event("it-reminder-later", EventType.WEBINAR, EventStatus.PUBLISHED, now.plus(2, ChronoUnit.DAYS)), awa, RegistrationStatus.REGISTERED);
        signUp(event("it-reminder-past", EventType.WEBINAR, EventStatus.PUBLISHED, now.minus(1, ChronoUnit.HOURS)), awa, RegistrationStatus.REGISTERED);

        assertThat(reminders.findDue(now))
                .extracting(DueReminder::registrationId, DueReminder::memberId, DueReminder::moment, DueReminder::eventPath, DueReminder::location)
                .containsExactly(tuple(awaRegistration, awa, DAY_BEFORE, "/rendez-vous/it-reminder-workshop", "https://meet.example.com/it-reminder-workshop"));
    }

    @Test
    @DisplayName("in the last hour only the hour-before reminder is due, even when the day-before one never went out")
    void hourBefore() {
        Event webinar = event("it-reminder-soon", EventType.WEBINAR, EventStatus.PUBLISHED, now.plus(30, ChronoUnit.MINUTES));
        signUp(webinar, awa, RegistrationStatus.REGISTERED);

        assertThat(reminders.findDue(now)).extracting(DueReminder::moment).containsExactly(HOUR_BEFORE);
        assertThat(reminders.findDue(now.plus(30, ChronoUnit.MINUTES))).isEmpty();
    }

    @Test
    @DisplayName("a reminder marked as sent is no longer due, and marking it again changes nothing")
    void markSent() {
        Event workshop = event("it-reminder-sent", EventType.WORKSHOP, EventStatus.PUBLISHED, now.plus(3, ChronoUnit.HOURS));
        signUp(workshop, awa, RegistrationStatus.REGISTERED);
        signUp(workshop, kofi, RegistrationStatus.REGISTERED);

        var due = reminders.findDue(now);
        assertThat(due).hasSize(2);
        reminders.markSent(due, now);
        reminders.markSent(due, now);
        reminders.markSent(List.of(), now);

        assertThat(reminders.findDue(now.plus(10, ChronoUnit.MINUTES))).isEmpty();
        assertThat(reminders.findDue(now.plus(150, ChronoUnit.MINUTES))).extracting(DueReminder::moment).containsExactly(HOUR_BEFORE, HOUR_BEFORE);
    }
}
