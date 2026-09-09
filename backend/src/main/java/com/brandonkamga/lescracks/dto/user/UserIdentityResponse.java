package com.brandonkamga.lescracks.dto.user;

import com.brandonkamga.lescracks.domain.AuthProvider;

import java.time.Instant;

public record UserIdentityResponse(AuthProvider provider, Instant linkedAt) {
}
