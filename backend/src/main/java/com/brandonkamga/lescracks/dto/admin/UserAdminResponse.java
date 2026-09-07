package com.brandonkamga.lescracks.dto.admin;

import com.brandonkamga.lescracks.domain.UserStatus;

import java.time.Instant;

public record UserAdminResponse(Long id, String email, String firstName, String lastName,
                                UserStatus status, Instant createdAt) {
}