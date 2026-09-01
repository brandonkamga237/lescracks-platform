package com.brandonkamga.lescracks.dto.resource;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

/** What every kind of resource carries, so the three requests below say only what differs. */
public record ResourceCommonRequest(
        @NotBlank(message = "Le titre est obligatoire.")
        @Size(max = 200, message = "Le titre ne peut pas dépasser 200 caractères.")
        String title,

        @Size(max = 500, message = "Le résumé ne peut pas dépasser 500 caractères.")
        String summary,

        @NotNull(message = "La catégorie est obligatoire.")
        Long categoryId,

        Set<Long> tagIds,
        Long coverId) {
}
