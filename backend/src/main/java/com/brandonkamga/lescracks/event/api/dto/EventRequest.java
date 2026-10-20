package com.brandonkamga.lescracks.event.api.dto;

import com.brandonkamga.lescracks.event.domain.EventFormat;
import com.brandonkamga.lescracks.event.domain.EventStatus;
import com.brandonkamga.lescracks.event.domain.EventType;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record EventRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String description,
        @NotNull EventType type,
        @NotNull EventFormat format,
        @NotNull Instant startDate,
        Instant endDate,
        @Size(max = 200) String location,
        EventStatus status,
        Instant scheduledAt,
        /** Projects handed in on the platform; absent means no. */
        Boolean acceptsSubmissions,
        @Min(1) @Max(4) Integer maxTeamSize,
        /** Last moment to submit; absent means the end of the event. */
        Instant submissionDeadline) {
}