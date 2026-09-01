package com.brandonkamga.lescracks.dto.application;

import com.brandonkamga.lescracks.domain.ApplicationStatus;
import com.brandonkamga.lescracks.domain.EnrolmentTarget;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * An application as the back office reads it.
 *
 * {@code hasAccount} is there because it decides what an admin can do next: accepting one
 * without an account cannot create a participation, and knowing that before clicking is
 * better than being told after.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApplicationResponse(
        Long id,
        EnrolmentTarget target,
        Long eventId,
        String eventTitle,
        String fullName,
        String email,
        String phone,
        String motivation,
        ApplicationStatus status,
        boolean hasAccount,
        Instant decidedAt,
        Instant createdAt) {
}
