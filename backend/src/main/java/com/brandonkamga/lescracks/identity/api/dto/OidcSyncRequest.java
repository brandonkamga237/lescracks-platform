package com.brandonkamga.lescracks.identity.api.dto;

import com.brandonkamga.lescracks.identity.domain.AuthProvider;

import jakarta.validation.constraints.NotNull;

public record OidcSyncRequest(@NotNull AuthProvider provider) {
}
