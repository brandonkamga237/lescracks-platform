package com.brandonkamga.lescracks.identity.api.dto;

import com.brandonkamga.lescracks.identity.domain.external.UserIdentity;
import com.brandonkamga.lescracks.identity.domain.member.AuthProvider;

import java.time.Instant;

public record UserIdentityResponse(AuthProvider provider, Instant linkedAt) {

    public static UserIdentityResponse of(UserIdentity identity) {
        return new UserIdentityResponse(identity.getProvider(), identity.getCreatedAt());
    }
}
