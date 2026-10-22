package com.brandonkamga.lescracks.account.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 10, message = "Le mot de passe doit contenir au moins 10 caractères.") String password) {
}