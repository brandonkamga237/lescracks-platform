package com.brandonkamga.lescracks.identity.domain.signup;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** One-time token sent by email to prove the address belongs to the user. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailVerificationToken {

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
        this.usedAt = Instant.now();
    }
}
