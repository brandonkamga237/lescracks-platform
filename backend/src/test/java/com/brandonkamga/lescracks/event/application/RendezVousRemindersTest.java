package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.DueReminder;
import com.brandonkamga.lescracks.mail.domain.Email;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.RendezVousReminderEmail;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static com.brandonkamga.lescracks.event.domain.model.ReminderMoment.DAY_BEFORE;
import static com.brandonkamga.lescracks.event.domain.model.ReminderMoment.HOUR_BEFORE;
import static org.assertj.core.api.Assertions.assertThat;

class RendezVousRemindersTest {

    private final InMemoryEvents.Reminders store = new InMemoryEvents.Reminders();
    private final InMemoryEvents.People people = new InMemoryEvents.People();
    private final List<Email> sent = new ArrayList<>();
    private final Mailer mailer = new Mailer() {
        @Override
        public void send(Email email) {
            sent.add(email);
        }

        @Override
        public String previewHtml(Email email) {
            return "";
        }
    };
    private final RendezVousReminders reminders = new RendezVousRemindersImpl(store, people, mailer);
    private final Instant now = Instant.parse("2026-12-04T12:00:00Z");
    private final Instant start = Instant.parse("2026-12-04T18:00:00Z");

    private DueReminder due(long registration, long member, boolean hourBefore) {
        return new DueReminder(registration, member, hourBefore ? HOUR_BEFORE : DAY_BEFORE, 7L, "git-en-equipe", "Git en équipe",
                start, "https://meet.example.com/git");
    }

    @Test
    @DisplayName("each due reminder becomes one email with the rendez-vous, and is never sent twice")
    void sendsOnce() {
        people.add(1L, "awa@example.com", "Awa");
        people.add(2L, "kofi@example.com", "Kofi");
        store.add(due(10L, 1L, false));
        store.add(due(11L, 2L, true));

        assertThat(reminders.sendDue(now)).isEqualTo(2);
        assertThat(reminders.sendDue(now)).isZero();

        assertThat(sent).containsExactly(
                new RendezVousReminderEmail("awa@example.com", "Awa", "Git en équipe", "/rendez-vous/git-en-equipe", start, false,
                        "https://meet.example.com/git"),
                new RendezVousReminderEmail("kofi@example.com", "Kofi", "Git en équipe", "/rendez-vous/git-en-equipe", start, true,
                        "https://meet.example.com/git"));
        assertThat(store.marked).containsExactly("10:DAY_BEFORE", "11:HOUR_BEFORE");
    }

    @Test
    @DisplayName("a suspended or deleted member gets nothing and is settled; an unverified one waits in case they verify")
    void skipsWhoMustNotHear() {
        people.addSuspended(1L, "banned@example.com", "Banned");
        people.addUnverified(2L, "new@example.com", "New");
        store.add(due(10L, 1L, false));
        store.add(due(11L, 2L, false));
        store.add(due(12L, 404L, false));

        assertThat(reminders.sendDue(now)).isZero();

        assertThat(sent).isEmpty();
        assertThat(store.marked).containsExactly("10:DAY_BEFORE", "12:DAY_BEFORE");
        assertThat(store.findDue(now)).extracting(DueReminder::registrationId).containsExactly(11L);
    }

    @Test
    @DisplayName("with nothing due, no member is looked up")
    void nothingDue() {
        assertThat(reminders.sendDue(now)).isZero();
        assertThat(people.lookups).isEmpty();
    }
}
