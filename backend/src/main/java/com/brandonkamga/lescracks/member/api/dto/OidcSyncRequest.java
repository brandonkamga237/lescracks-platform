package com.brandonkamga.lescracks.member.api.dto;

import com.brandonkamga.lescracks.account.domain.model.AuthProvider;

import jakarta.validation.constraints.NotNull;

public record OidcSyncRequest(@NotNull AuthProvider provider) {
}
