package com.brandonkamga.lescracks.account.api.dto;

import com.brandonkamga.lescracks.account.domain.model.ExternalIdentity;
import com.brandonkamga.lescracks.account.domain.model.AuthProvider;

import java.time.Instant;

public record IdentityResponse(AuthProvider provider, Instant linkedAt) {

    public static IdentityResponse of(ExternalIdentity identity) {
        return new IdentityResponse(identity.getProvider(), identity.getCreatedAt());
    }
}
