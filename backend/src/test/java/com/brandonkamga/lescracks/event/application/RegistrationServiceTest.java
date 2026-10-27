package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventFormat;
import com.brandonkamga.lescracks.event.domain.model.EventStatus;
import com.brandonkamga.lescracks.event.domain.model.EventType;
import com.brandonkamga.lescracks.event.domain.model.Registration;
import com.brandonkamga.lescracks.event.domain.model.RegistrationStatus;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RegistrationServiceTest {

    private final InMemoryEvents.Events events = new InMemoryEvents.Events();
    private final InMemoryEvents.Registrations registrations = new InMemoryEvents.Registrations(events);
    private final InMemoryEvents.People people = new InMemoryEvents.People();
    private final RegistrationService service = new RegistrationServiceImpl(registrations, events, people);
    private final Instant now = Instant.now();

    private Event workshop;

    @BeforeEach
    void setUp() {
        people.add(1L, "awa@example.com", "Awa");
        people.add(2L, "kofi@example.com", "Kofi");
        workshop = event(EventStatus.PUBLISHED, now.plus(3, ChronoUnit.DAYS), null);
    }

    private Event event(EventStatus status, Instant start, Instant end) {
        return events.add(Event.builder().slug("e" + start.toEpochMilli()).title("Atelier").description("D").type(EventType.WORKSHOP)
                .format(EventFormat.ONLINE).status(status).startDate(start).endDate(end).build());
    }

    @Test
    @DisplayName("signing up counts the member once, and signing up again changes nothing")
    void registersOnce() {
        Registration first = service.register(workshop.getId(), "awa@example.com");
        Registration again = service.register(workshop.getId(), "AWA@example.com");

        assertThat(again.getId()).isEqualTo(first.getId());
        assertThat(registrations.all()).hasSize(1);
        assertThat(events.stored(workshop.getId()).getRegistrationCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("an event that is over takes no new sign-ups, and a draft answers as if it did not exist")
    void refusesClosedEvents() {
        Event over = event(EventStatus.PUBLISHED, now.minus(3, ChronoUnit.DAYS), now.minus(2, ChronoUnit.DAYS));
        Event draft = event(EventStatus.DRAFT, now.plus(5, ChronoUnit.DAYS), null);

        assertThatThrownBy(() -> service.register(over.getId(), "awa@example.com")).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.register(draft.getId(), "awa@example.com")).isInstanceOf(NotFoundException.class);
        assertThat(registrations.all()).isEmpty();
    }

    @Test
    @DisplayName("cancelling frees the seat once; a second cancel does nothing, and signing up again reuses the row")
    void cancelsOnce() {
        service.register(workshop.getId(), "awa@example.com");

        service.cancel(workshop.getId(), "awa@example.com");
        service.cancel(workshop.getId(), "awa@example.com");

        assertThat(events.stored(workshop.getId()).getRegistrationCount()).isZero();
        assertThat(service.find(workshop.getId(), "awa@example.com")).isEmpty();

        service.register(workshop.getId(), "awa@example.com");
        assertThat(registrations.all()).singleElement().extracting(Registration::getStatus).isEqualTo(RegistrationStatus.REGISTERED);
        assertThat(events.stored(workshop.getId()).getRegistrationCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("a member who leaves the platform stops counting on the events they still held, and only those")
    void forgetsALeavingMember() {
        Event other = event(EventStatus.PUBLISHED, now.plus(6, ChronoUnit.DAYS), null);
        service.register(workshop.getId(), "awa@example.com");
        service.register(other.getId(), "awa@example.com");
        service.cancel(other.getId(), "awa@example.com");
        service.register(workshop.getId(), "kofi@example.com");

        service.forgetMember(1L);

        assertThat(events.stored(workshop.getId()).getRegistrationCount()).isEqualTo(1);
        assertThat(events.stored(other.getId()).getRegistrationCount()).isZero();
    }

    @Test
    @DisplayName("attendance is present or absent, can be undone back to « registered », and never touches a cancelled seat")
    void attendanceIsPresentOrAbsent() {
        Registration awa = service.register(workshop.getId(), "awa@example.com");
        Registration kofi = service.register(workshop.getId(), "kofi@example.com");
        service.cancel(workshop.getId(), "kofi@example.com");

        assertThat(service.markAttendance(awa.getId(), RegistrationStatus.ATTENDED).getStatus()).isEqualTo(RegistrationStatus.ATTENDED);
        assertThat(registrations.findById(awa.getId())).get().extracting(Registration::getStatus).isEqualTo(RegistrationStatus.ATTENDED);
        assertThat(service.markAttendance(awa.getId(), RegistrationStatus.REGISTERED).getStatus()).isEqualTo(RegistrationStatus.REGISTERED);
        assertThatThrownBy(() -> service.markAttendance(awa.getId(), RegistrationStatus.CANCELLED)).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.markAttendance(kofi.getId(), RegistrationStatus.ABSENT)).isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("a member's events come latest first with their event, read in one lookup; the admin list names every member at once")
    void listsWithTheirEventAndMember() {
        Event later = event(EventStatus.PUBLISHED, now.plus(20, ChronoUnit.DAYS), null);
        service.register(workshop.getId(), "awa@example.com");
        service.register(later.getId(), "awa@example.com");
        service.register(workshop.getId(), "kofi@example.com");

        assertThat(service.listMine("awa@example.com")).extracting(mine -> mine.event().getId())
                .containsExactly(later.getId(), workshop.getId());
        assertThat(service.listForEvent(workshop.getId())).extracting(view -> view.member().getFirstName()).containsExactly("Awa", "Kofi");
        assertThat(people.lookups).containsExactly(Set.of(1L, 2L));
    }

    @Test
    @DisplayName("the people named on a project are signed up even once the event has started")
    void ensuresRegistration() {
        Event running = event(EventStatus.PUBLISHED, now.minus(1, ChronoUnit.DAYS), now.plus(1, ChronoUnit.DAYS));

        service.ensureRegistered(running.getId(), List.of(1L, 2L));
        service.ensureRegistered(running.getId(), List.of(1L));

        assertThat(registrations.findByEvent(running.getId())).hasSize(2);
        assertThat(events.stored(running.getId()).getRegistrationCount()).isEqualTo(2);
    }
}
