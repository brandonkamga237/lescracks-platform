package com.brandonkamga.lescracks.event.api.dto;

import com.brandonkamga.lescracks.event.domain.EventFormat;
import com.brandonkamga.lescracks.event.domain.EventStatus;
import com.brandonkamga.lescracks.event.domain.EventType;

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