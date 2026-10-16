package com.brandonkamga.lescracks.identity.api.dto;

import com.brandonkamga.lescracks.identity.domain.Credentials;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserLoginRequest(@Email @NotBlank String email, @NotBlank String password) {

    public Credentials toCredentials() {
        return new Credentials(email, password);
    }
}