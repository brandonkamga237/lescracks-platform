package com.brandonkamga.lescracks.event.domain;

import com.brandonkamga.lescracks.event.infra.EventRegistrationRepository;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventRegistrationServiceTest {

    @Mock private EventRegistrationRepository registrations;
    @Mock private EventService events;
    @Mock private MemberDirectory people;

    private EventRegistrationServiceImpl service;
    private final Member member = Member.builder().id(7L).email("awa@example.com").build();

    @BeforeEach
    void setUp() {
        service = new EventRegistrationServiceImpl(registrations, events, people);
    }

    private Event event(EventStatus status, Instant end) {
        Event event = Event.builder().id(3L).status(status).startDate(Instant.now().minus(1, ChronoUnit.DAYS)).endDate(end).build();
        when(events.require(3L)).thenReturn(event);
        return event;
    }

    @Test
    @DisplayName("signing up counts the member once, and signing up again changes nothing")
    void registersOnce() {
        event(EventStatus.PUBLISHED, Instant.now().plus(10, ChronoUnit.DAYS));
        when(people.require("awa@example.com")).thenReturn(member);
        when(registrations.findByEventIdAndUserId(3L, 7L)).thenReturn(Optional.empty());
        when(registrations.save(any())).thenAnswer(call -> call.getArgument(0));

        assertThat(service.register(3L, "awa@example.com").getStatus()).isEqualTo(RegistrationStatus.REGISTERED);
        verify(registrations).shiftRegistrationCount(3L, 1);

        EventRegistration existing = EventRegistration.builder().userId(7L).status(RegistrationStatus.REGISTERED).build();
        when(registrations.findByEventIdAndUserId(3L, 7L)).thenReturn(Optional.of(existing));
        assertThat(service.register(3L, "awa@example.com")).isSameAs(existing);
        verify(registrations, org.mockito.Mockito.times(1)).shiftRegistrationCount(anyLong(), anyInt());
    }

    @Test
    @DisplayName("an event that is over takes no new sign-ups")
    void refusesAFinishedEvent() {
        event(EventStatus.PUBLISHED, Instant.now().minus(1, ChronoUnit.HOURS));

        assertThatThrownBy(() -> service.register(3L, "awa@example.com")).isInstanceOf(BadRequestException.class);
        verify(registrations, never()).save(any());
    }

    @Test
    @DisplayName("a draft event answers as if it did not exist")
    void refusesADraft() {
        event(EventStatus.DRAFT, Instant.now().plus(1, ChronoUnit.DAYS));

        assertThatThrownBy(() -> service.register(3L, "awa@example.com")).isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("cancelling frees the seat once; a second cancel does nothing")
    void cancelsOnce() {
        EventRegistration registration = EventRegistration.builder().userId(7L).status(RegistrationStatus.REGISTERED).build();
        when(people.require("awa@example.com")).thenReturn(member);
        when(registrations.findByEventIdAndUserId(3L, 7L)).thenReturn(Optional.of(registration));

        service.cancel(3L, "awa@example.com");
        service.cancel(3L, "awa@example.com");

        assertThat(registration.getStatus()).isEqualTo(RegistrationStatus.CANCELLED);
        verify(registrations, org.mockito.Mockito.times(1)).shiftRegistrationCount(3L, -1);
    }

    @Test
    @DisplayName("attendance is present or absent, never a return to « registered »")
    void attendanceIsPresentOrAbsent() {
        assertThatThrownBy(() -> service.markAttendance(1L, RegistrationStatus.REGISTERED)).isInstanceOf(BadRequestException.class);

        EventRegistration registration = EventRegistration.builder().id(1L).status(RegistrationStatus.REGISTERED).build();
        when(registrations.findById(1L)).thenReturn(Optional.of(registration));
        assertThat(service.markAttendance(1L, RegistrationStatus.ATTENDED).getStatus()).isEqualTo(RegistrationStatus.ATTENDED);
    }
}
