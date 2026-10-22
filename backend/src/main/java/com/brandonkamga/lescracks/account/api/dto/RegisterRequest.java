package com.brandonkamga.lescracks.account.api.dto;

import com.brandonkamga.lescracks.account.application.Registration;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Email(message = "L'adresse email est invalide.") @NotBlank String email,
        @NotBlank @Size(min = 10, message = "Le mot de passe doit contenir au moins 10 caractères.") String password,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @Size(max = 30) String phone,
        Boolean marketingConsent,
        /** Subscribe to the newsletter; unticked by default, as consent must be. */
        Boolean newsletter,
        @Valid SignupContext context) {

    public Registration toRegistration() {
        return new Registration(email, password, firstName, lastName, phone, marketingConsent, newsletter,
                context == null ? null : context.toArrival());
    }
}