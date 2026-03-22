package com.brandonkamga.lescracks.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Requête de création/mise à jour de ressource")
public class ResourceRequest {

    @Schema(description = "Titre de la ressource", example = "Cours Spring Boot", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Title is required")
    private String title;

    @Schema(description = "Description de la ressource")
    private String description;

    @Schema(description = "URL de la ressource. Obligatoire pour les ressources EXTERNAL ; fourni automatiquement pour les ressources UPLOADED après upload.")
    private String url;

    @Schema(description = "ID de la catégorie", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Category ID is required")
    private Long categoryId;

    @Schema(description = "ID du type de ressource", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Resource type ID is required")
    private Long resourceTypeId;

    @Schema(description = "Liste des IDs des tags")
    private Set<Long> tagIds;

    // ResourceMetadata fields
    @Schema(description = "Taille du fichier en octets")
    private Long fileSize;

    @Schema(description = "Type MIME du fichier", example = "application/pdf")
    private String mimeType;

    @Schema(description = "URL de l'image de prévisualisation")
    private String previewImageUrl;

    @Schema(description = "Source de la ressource : EXTERNAL (lien YouTube, etc.) ou UPLOADED (fichier stocké sur la plateforme)", example = "EXTERNAL")
    @Builder.Default
    private String sourceType = "EXTERNAL";

    @Schema(description = "Réservé aux utilisateurs premium uniquement", example = "false")
    @Builder.Default
    private boolean premium = false;

    @Schema(description = "Autoriser le téléchargement de cette ressource", example = "true")
    @Builder.Default
    private boolean downloadable = true;
}
