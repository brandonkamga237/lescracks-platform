package com.brandonkamga.lescracks.account.api.dto;

import com.brandonkamga.lescracks.account.application.AccountSummary;
import com.brandonkamga.lescracks.account.domain.model.AuthProvider;

public record AuthResponse(Long id, String email, String firstName, String lastName, boolean verified, AuthProvider provider) {

    public static AuthResponse of(AccountSummary account) {
        return new AuthResponse(account.getId(), account.getEmail(), account.getFirstName(), account.getLastName(),
                account.isEmailVerified(), account.getProvider());
    }
}
