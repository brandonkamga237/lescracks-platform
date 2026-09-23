package com.brandonkamga.lescracks.event.api.dto;

import com.brandonkamga.lescracks.event.domain.EventFormat;
import com.brandonkamga.lescracks.event.domain.EventStatus;
import com.brandonkamga.lescracks.event.domain.EventType;

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
        Instant updatedAt) {
}
