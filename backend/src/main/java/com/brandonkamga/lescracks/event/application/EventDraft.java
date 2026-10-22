package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.EventFormat;
import com.brandonkamga.lescracks.event.domain.model.EventStatus;
import com.brandonkamga.lescracks.event.domain.model.EventType;

import java.time.Instant;

/** What an admin writes for an event. */
public record EventDraft(String title, String description, EventType type, EventFormat format, Instant startDate,
                         Instant endDate, String location, EventStatus status, Instant scheduledAt,
                         Boolean acceptsSubmissions, Integer maxTeamSize, Instant submissionDeadline) {
}
