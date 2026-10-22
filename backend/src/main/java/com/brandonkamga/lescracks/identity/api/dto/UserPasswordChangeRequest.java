package com.brandonkamga.lescracks.identity.api.dto;

import com.brandonkamga.lescracks.identity.domain.credential.PasswordChange;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserPasswordChangeRequest(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 10, message = "Le nouveau mot de passe doit contenir au moins 10 caractères.") String newPassword,
        @NotBlank String confirmPassword
) {

    public PasswordChange toChange() {
        return new PasswordChange(currentPassword, newPassword, confirmPassword);
    }
}
