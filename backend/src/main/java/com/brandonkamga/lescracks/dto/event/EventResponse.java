package com.brandonkamga.lescracks.dto.event;

import com.brandonkamga.lescracks.domain.EventFormat;
import com.brandonkamga.lescracks.domain.EventStatus;
import com.brandonkamga.lescracks.domain.EventType;

import java.time.Instant;

public record EventResponse(
        Long id,
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
