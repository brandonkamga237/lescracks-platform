package com.brandonkamga.lescracks.event.domain.model;

import java.time.Instant;

/** A reminder whose moment has come and that has not gone out yet, with what its email needs. */
public record DueReminder(Long registrationId, Long memberId, ReminderMoment moment, Long eventId, String eventSlug,
                          String eventTitle, Instant startDate, String location) {

    public String eventPath() {
        return Event.pathOf(eventId, eventSlug);
    }
}
