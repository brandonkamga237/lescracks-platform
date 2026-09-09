package com.brandonkamga.lescracks.dto.auth;

import com.brandonkamga.lescracks.domain.AuthProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LinkIdentityRequest(@NotNull AuthProvider provider, @NotBlank String token) {
}
