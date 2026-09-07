package com.brandonkamga.lescracks.dto.event;

import com.brandonkamga.lescracks.domain.EventFormat;
import com.brandonkamga.lescracks.domain.EventStatus;
import com.brandonkamga.lescracks.domain.EventType;
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
        EventStatus status) {
}