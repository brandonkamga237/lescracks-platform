package com.brandonkamga.lescracks.dto.user;

import com.brandonkamga.lescracks.domain.UserStatus;

import java.time.Instant;

public record UserProfileResponse(Long id, String email, String firstName, String lastName,
                                  UserStatus status, boolean verified, Instant createdAt) {
}
