package com.brandonkamga.lescracks.account.api.dto;

import com.brandonkamga.lescracks.account.application.PasswordChange;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordChangeRequest(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 10, message = "Le nouveau mot de passe doit contenir au moins 10 caractères.") String newPassword,
        @NotBlank String confirmPassword
) {

    public PasswordChange toChange() {
        return new PasswordChange(currentPassword, newPassword, confirmPassword);
    }
}
