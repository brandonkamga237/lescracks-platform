package com.brandonkamga.lescracks.dto.auth;

import com.brandonkamga.lescracks.domain.AuthProvider;
import jakarta.validation.constraints.NotNull;

public record OidcSyncRequest(@NotNull AuthProvider provider) {
}
