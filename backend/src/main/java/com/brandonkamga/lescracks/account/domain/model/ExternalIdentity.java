package com.brandonkamga.lescracks.account.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** A Google or GitHub sign-in linked to an account: one per provider, the account stays the source of truth. */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class ExternalIdentity {

    private Long id;

    private Long accountId;

    private AuthProvider provider;

    private String externalId;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();
}
