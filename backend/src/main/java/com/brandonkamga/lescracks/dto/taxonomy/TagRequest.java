package com.brandonkamga.lescracks.dto.taxonomy;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TagRequest(
        @NotBlank(message = "Le nom du tag est obligatoire.")
        @Size(max = 60, message = "Le nom ne peut pas dépasser 60 caractères.")
        String name,

        @NotNull(message = "La catégorie est obligatoire.")
        Long categoryId) {
}
