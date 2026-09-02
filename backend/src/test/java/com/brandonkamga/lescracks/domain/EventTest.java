package com.brandonkamga.lescracks.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The phase is read from the dates every time, never stored. A stored status is a second
 * copy of the truth, and the two drift the first time nobody runs the job that syncs them.
 */
class EventTest {

    private static Event between(Instant start, Instant end) {
        return Event.builder().kind(EventKind.BOOTCAMP).title("B").slug("b")
                .startsAt(start).endsAt(end).build();
    }

    private static Instant daysFromNow(long days) {
        return Instant.now().plus(days, ChronoUnit.DAYS);
    }

    @Test
    @DisplayName("an event that has not started is upcoming, and nothing else")
    void futureEventIsUpcoming() {
        Event event = between(daysFromNow(3), daysFromNow(5));

        assertThat(event.isUpcoming()).isTrue();
        assertThat(event.isRunning()).isFalse();
        assertThat(event.isPast()).isFalse();
    }

    @Test
    @DisplayName("an event whose end has passed is past, and nothing else")
    void finishedEventIsPast() {
        Event event = between(daysFromNow(-5), daysFromNow(-3));

        assertThat(event.isPast()).isTrue();
        assertThat(event.isUpcoming()).isFalse();
        assertThat(event.isRunning()).isFalse();
    }

    @Test
    @DisplayName("between its dates it is running")
    void ongoingEventIsRunning() {
        Event event = between(daysFromNow(-1), daysFromNow(1));

        assertThat(event.isRunning()).isTrue();
        assertThat(event.isUpcoming()).isFalse();
        assertThat(event.isPast()).isFalse();
    }

    @Test
    @DisplayName("without an end date the start bounds the event")
    void openEndedEventEndsAtItsStart() {
        Event started = between(daysFromNow(-1), null);

        assertThat(started.effectiveEnd()).isEqualTo(started.getStartsAt());
        assertThat(started.isPast()).isTrue();
    }

    @Test
    @DisplayName("an open-ended event still to come is upcoming, not past")
    void openEndedFutureEventIsUpcoming() {
        Event event = between(daysFromNow(2), null);

        assertThat(event.isUpcoming()).isTrue();
        assertThat(event.isPast()).isFalse();
    }

    @Test
    @DisplayName("the three phases are mutually exclusive and always cover the event")
    void phasesArePartition() {
        for (Event event : new Event[]{
                between(daysFromNow(3), daysFromNow(5)),
                between(daysFromNow(-1), daysFromNow(1)),
                between(daysFromNow(-5), daysFromNow(-3)),
                between(daysFromNow(2), null),
                between(daysFromNow(-2), null)}) {

            long inPhase = (event.isUpcoming() ? 1 : 0) + (event.isRunning() ? 1 : 0) + (event.isPast() ? 1 : 0);
            assertThat(inPhase).isEqualTo(1);
        }
    }
}
