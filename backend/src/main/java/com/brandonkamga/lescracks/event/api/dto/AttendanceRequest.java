package com.brandonkamga.lescracks.event.api.dto;

import com.brandonkamga.lescracks.event.domain.model.RegistrationStatus;

import jakarta.validation.constraints.NotNull;

public record AttendanceRequest(@NotNull RegistrationStatus status) {
}
