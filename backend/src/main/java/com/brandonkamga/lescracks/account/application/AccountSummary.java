package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountStatus;
import com.brandonkamga.lescracks.account.domain.model.AuthProvider;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

/** An account as other modules and screens see it: everything but the password hash. */
@Value
@Builder
public class AccountSummary {
    Long id;
    String email;
    String firstName;
    String lastName;
    AccountStatus status;
    boolean emailVerified;
    AuthProvider provider;
    Instant createdAt;
    Instant lastSeenAt;
    String signupPath;
    boolean loginMethod;

    /** False for a newsletter-only contact: no password and no Google or GitHub login. */
    public boolean hasLoginMethod() {
        return loginMethod;
    }

    public boolean isActive() {
        return status == AccountStatus.ACTIVE;
    }

    public static AccountSummary of(Account account) {
        return AccountSummary.builder()
                .id(account.getId())
                .email(account.getEmail())
                .firstName(account.getFirstName())
                .lastName(account.getLastName())
                .status(account.getStatus())
                .emailVerified(account.isEmailVerified())
                .provider(account.getProvider())
                .createdAt(account.getCreatedAt())
                .lastSeenAt(account.getLastSeenAt())
                .signupPath(account.getSignupPath())
                .loginMethod(account.hasLoginMethod())
                .build();
    }
}
