package com.brandonkamga.lescracks.dto.resource;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * An article written on the platform.
 *
 * The body arrives as the editor's block document. Its prose, its reading time and the images
 * it uses are all derived on save, so none of the three is asked for here — a caller cannot
 * supply them wrongly or forget them.
 */
public record ArticleRequest(
        @NotNull @Valid ResourceCommonRequest common,

        @NotNull(message = "Le contenu de l'article est obligatoire.")
        JsonNode body,

        @Size(max = 120, message = "Le nom de l'auteur ne peut pas dépasser 120 caractères.")
        String authorName) {
}
