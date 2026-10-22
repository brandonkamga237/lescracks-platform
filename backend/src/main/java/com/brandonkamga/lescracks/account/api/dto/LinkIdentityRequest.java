package com.brandonkamga.lescracks.account.api.dto;

import com.brandonkamga.lescracks.account.domain.model.AuthProvider;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LinkIdentityRequest(@NotNull AuthProvider provider, @NotBlank String token) {
}
