package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventFormat;
import com.brandonkamga.lescracks.event.domain.model.EventStatus;
import com.brandonkamga.lescracks.event.domain.model.EventType;
import com.brandonkamga.lescracks.event.domain.model.Registration;
import com.brandonkamga.lescracks.mail.domain.Email;
import com.brandonkamga.lescracks.mail.domain.EventUpdateEmail;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RegistrantMessagesTest {

    private final InMemoryEvents.Events events = new InMemoryEvents.Events();
    private final InMemoryEvents.Registrations registrations = new InMemoryEvents.Registrations(events);
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
    private final RegistrantMessages messages = new RegistrantMessagesImpl(events, registrations, people, mailer);
    private final Instant deadline = Instant.parse("2026-11-15T22:59:00Z");
    private Event hackathon;

    @BeforeEach
    void setUp() {
        hackathon = events.add(Event.builder().slug("hackathon-001").title("Hackathon 001").description("D").type(EventType.HACKATHON)
                .format(EventFormat.ONLINE).status(EventStatus.PUBLISHED).startDate(Instant.parse("2026-10-30T23:00:00Z"))
                .endDate(deadline).acceptsSubmissions(true).maxTeamSize(1).build());
        people.add(1L, "awa@example.com", "Awa");
        people.add(2L, "kofi@example.com", "Kofi");
        people.addSuspended(3L, "banned@example.com", "Banned");
        people.add(4L, "left@example.com", "Left");
        for (long id = 1; id <= 4; id++) registrations.save(Registration.builder().eventId(hackathon.getId()).userId(id).build());
        Registration cancelled = registrations.find(hackathon.getId(), 4L).orElseThrow();
        cancelled.cancel();
        registrations.save(cancelled);
    }

    @Test
    @DisplayName("every active registrant gets the message with the event page and deadline; cancelled and suspended ones do not")
    void writesToActiveRegistrants() {
        int count = messages.write(hackathon.getId(), "  Le thème change.\n\nRendez-vous sur la page.  ");

        assertThat(count).isEqualTo(2);
        assertThat(sent).containsExactly(
                new EventUpdateEmail("awa@example.com", "Awa", "Hackathon 001", "/evenements/hackathon-001",
                        "Le thème change.\n\nRendez-vous sur la page.", deadline),
                new EventUpdateEmail("kofi@example.com", "Kofi", "Hackathon 001", "/evenements/hackathon-001",
                        "Le thème change.\n\nRendez-vous sur la page.", deadline));
        assertThat(people.lookups).hasSize(1);
    }

    @Test
    @DisplayName("an empty or overlong message and an unknown event send nothing")
    void refusesBadRequests() {
        assertThatThrownBy(() -> messages.write(hackathon.getId(), "   ")).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> messages.write(hackathon.getId(), "x".repeat(2001))).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> messages.write(999L, "Bonjour")).isInstanceOf(NotFoundException.class);
        assertThat(sent).isEmpty();
    }
}
