package com.brandonkamga.lescracks.dto.application;

import com.brandonkamga.lescracks.domain.EnrolmentTarget;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * What someone sends to apply.
 *
 * No account is needed. People apply first and register afterwards, and demanding a sign-up
 * before the form is what loses the ones who would have filled it in.
 */
public record ApplicationRequest(
        @NotNull(message = "Précisez ce à quoi vous postulez.")
        EnrolmentTarget target,

        /** Required when the target is an event; the service checks the pairing. */
        Long eventId,

        @NotBlank(message = "Votre nom est obligatoire.")
        @Size(max = 160, message = "Le nom ne peut pas dépasser 160 caractères.")
        String fullName,

        @NotBlank(message = "Votre email est obligatoire.")
        @Email(message = "Cet email n'est pas valide.")
        String email,

        @Size(max = 40, message = "Le numéro ne peut pas dépasser 40 caractères.")
        String phone,

        @Size(max = 4000, message = "Votre message ne peut pas dépasser 4000 caractères.")
        String motivation) {
}
