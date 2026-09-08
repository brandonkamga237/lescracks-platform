package com.brandonkamga.lescracks.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserPasswordChangeRequest(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 10, message = "Le nouveau mot de passe doit contenir au moins 10 caractères.") String newPassword,
        @NotBlank String confirmPassword
) {
}
