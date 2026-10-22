package com.brandonkamga.lescracks.account.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * What lets a person sign in: an email, a password or a linked provider, a status. The profile
 * is the member module's, the newsletter list the newsletter's.
 */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class Account {

    private Long id;

    private String email;

    private String passwordHash;

    private String firstName;

    private String lastName;

    @Builder.Default
    private AccountStatus status = AccountStatus.ACTIVE;

    private boolean emailVerified;

    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();

    private Instant lastSeenAt;

    private String signupPath;

    private String signupLanguage;

    private String signupTimezone;

    public boolean isActive() {
        return status == AccountStatus.ACTIVE;
    }

    /** Recorded once, from the first visit that led to an account; later calls never overwrite it. */
    public void recordArrival(String path, String language, String timezone) {
        if (signupPath == null) signupPath = trimmed(path);
        if (signupLanguage == null) signupLanguage = trimmed(language);
        if (signupTimezone == null) signupTimezone = trimmed(timezone);
    }

    private static String trimmed(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
