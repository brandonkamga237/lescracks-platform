package com.brandonkamga.lescracks.identity.api.dto;

import com.brandonkamga.lescracks.identity.domain.AuthProvider;
import com.brandonkamga.lescracks.identity.domain.UserStatus;

import java.time.Instant;

public record UserAdminResponse(Long id, String email, String firstName, String lastName,
                                UserStatus status, boolean verified, AuthProvider provider, Instant createdAt) {
}