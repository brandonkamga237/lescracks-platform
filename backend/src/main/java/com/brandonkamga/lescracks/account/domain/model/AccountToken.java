package com.brandonkamga.lescracks.account.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * A single-use link sent by email (address verification, password reset). Only the hash of the
 * token is stored; once {@code usedAt} is set it can no longer be redeemed.
 */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class AccountToken {

    private Long id;

    private Long accountId;

    private TokenPurpose purpose;

    private String tokenHash;

    private Instant expiresAt;

    private Instant usedAt;

    @Builder.Default
    private Instant createdAt = Instant.now();

    public boolean isValid() {
        return usedAt == null && expiresAt.isAfter(Instant.now());
    }

    public void markUsed() {
        usedAt = Instant.now();
    }
}
