package com.brandonkamga.lescracks.event.api.dto;

import com.brandonkamga.lescracks.event.application.EventView;
import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventFormat;
import com.brandonkamga.lescracks.event.domain.model.EventStatus;
import com.brandonkamga.lescracks.event.domain.model.EventType;

import java.time.Instant;

public record EventResponse(
        Long id,
        String slug,
        String title,
        String description,
        EventType type,
        EventFormat format,
        Instant startDate,
        Instant endDate,
        String location,
        String coverImage,
        EventStatus status,
        Instant createdAt,
        Instant updatedAt,
        Instant scheduledAt,
        int viewCount,
        int registrationCount,
        boolean acceptsSubmissions,
        int maxTeamSize,
        /** When submissions close: the deadline, or the end of the event. */
        Instant submissionsCloseAt) {

    public static EventResponse of(EventView view) {
        Event event = view.event();
        return new EventResponse(event.getId(), event.getSlug(), event.getTitle(), event.getDescription(), event.getType(),
                event.getFormat(), event.getStartDate(), event.getEndDate(), event.getLocation(), event.getCoverImage(),
                event.getStatus(), event.getCreatedAt(), event.getUpdatedAt(), event.getScheduledAt(), view.counts().views(),
                event.getRegistrationCount(), event.isAcceptsSubmissions(), event.getMaxTeamSize(), event.submissionsCloseAt());
    }
}
