package com.brandonkamga.lescracks.dto.taxonomy;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank(message = "Le nom de la catégorie est obligatoire.")
        @Size(max = 80, message = "Le nom ne peut pas dépasser 80 caractères.")
        String name) {
}
