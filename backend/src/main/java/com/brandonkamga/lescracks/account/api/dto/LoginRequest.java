package com.brandonkamga.lescracks.account.api.dto;

import com.brandonkamga.lescracks.account.application.Credentials;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {

    public Credentials toCredentials() {
        return new Credentials(email, password);
    }
}