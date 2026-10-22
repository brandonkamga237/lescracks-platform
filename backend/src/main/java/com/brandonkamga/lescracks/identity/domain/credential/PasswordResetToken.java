package com.brandonkamga.lescracks.identity.domain.credential;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * A token allowing a user to reset their password.
 *
 * Only the hash of the token is stored, never the token itself. A token is
 * single-use: once {@code usedAt} is set it can no longer be redeemed.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetToken {

    private Long id;

    private Long userId;

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
