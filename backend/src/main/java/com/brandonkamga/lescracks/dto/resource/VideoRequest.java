package com.brandonkamga.lescracks.dto.resource;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** A video the platform points at. Hosting video is a business we chose not to be in. */
public record VideoRequest(
        @NotNull @Valid ResourceCommonRequest common,

        @NotBlank(message = "Le lien de la vidéo est obligatoire.")
        String externalUrl,

        @Positive(message = "La durée doit être supérieure à zéro.")
        Integer durationSeconds) {
}
