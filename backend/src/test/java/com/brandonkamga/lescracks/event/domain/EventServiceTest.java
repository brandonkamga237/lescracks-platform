package com.brandonkamga.lescracks.event.domain;

import com.brandonkamga.lescracks.event.api.dto.EventRequest;
import com.brandonkamga.lescracks.event.infra.EventRepository;
import com.brandonkamga.lescracks.newsletter.domain.NewsletterService;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.storage.domain.StorageService;

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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock private EventRepository events;
    @Mock private NewsletterService newsletter;
    @Mock private StorageService storage;

    private EventServiceImpl service;
    private final Instant start = Instant.now().plus(10, ChronoUnit.DAYS);

    @BeforeEach
    void setUp() {
        service = new EventServiceImpl(events, newsletter, storage);
    }

    private EventRequest request(EventStatus status, Instant scheduledAt) {
        return new EventRequest("Atelier Docker", "Une après-midi pour conteneuriser une API.", EventType.WORKSHOP,
                EventFormat.ONLINE, start, null, null, status, scheduledAt);
    }

    @Test
    @DisplayName("a scheduled event waits as a draft and is announced only when the scheduler publishes it")
    void scheduledEventWaits() {
        Instant tomorrow = Instant.now().plus(1, ChronoUnit.DAYS);
        when(events.save(any(Event.class))).thenAnswer(call -> call.getArgument(0));

        Event event = service.create(request(EventStatus.PUBLISHED, tomorrow), null);

        assertThat(event.getStatus()).isEqualTo(EventStatus.DRAFT);
        assertThat(event.getScheduledAt()).isEqualTo(tomorrow);
        verify(newsletter, never()).notifyEventSubscribers(any());

        event.setId(7L);
        when(events.findById(7L)).thenReturn(Optional.of(event));
        assertThat(service.publishScheduled(7L, tomorrow)).isTrue();
        assertThat(event.getStatus()).isEqualTo(EventStatus.PUBLISHED);
        assertThat(event.getScheduledAt()).isNull();

        service.announce(7L);
        verify(newsletter).notifyEventSubscribers(event);
    }

    @Test
    @DisplayName("publishing after the event has started makes no sense and is refused")
    void scheduleAfterStartRefused() {
        assertThatThrownBy(() -> service.create(request(EventStatus.DRAFT, start.plus(1, ChronoUnit.HOURS)), null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("début");
    }
}
