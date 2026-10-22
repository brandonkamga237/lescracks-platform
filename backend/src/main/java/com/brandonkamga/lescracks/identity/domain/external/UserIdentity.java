package com.brandonkamga.lescracks.identity.domain.external;

import com.brandonkamga.lescracks.identity.domain.member.AuthProvider;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * An external identity provider linked to a local user account.
 *
 * A user can have one identity per provider (Google, GitHub). The local account is
 * the single source of truth for the profile; providers are only sign-in methods.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserIdentity {

    private Long id;

    private Long userId;

    private AuthProvider provider;

    private String externalId;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();
}
