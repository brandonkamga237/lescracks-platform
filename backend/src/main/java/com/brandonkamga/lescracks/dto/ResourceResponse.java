package com.brandonkamga.lescracks.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Réponse contenant les informations d'une ressource")
public class ResourceResponse {

    @Schema(description = "ID unique de la ressource", example = "1")
    private Long id;

    @Schema(description = "Titre de la ressource")
    private String title;

    @Schema(description = "Description de la ressource")
    private String description;

    @Schema(description = "URL de la ressource")
    private String url;

    @Schema(description = "Date de création")
    private LocalDateTime createdAt;

    @Schema(description = "ID de la catégorie")
    private Long categoryId;

    @Schema(description = "Nom de la catégorie")
    private String categoryName;

    @Schema(description = "ID du type de ressource")
    private Long resourceTypeId;

    @Schema(description = "Nom du type de ressource")
    private String resourceTypeName;

    @Schema(description = "Tags associés à la ressource")
    private Set<TagDto> tags;

    @Schema(description = "Métadonnées du fichier")
    private ResourceMetadataDto metadata;

    @Schema(description = "URL de l'image de prévisualisation")
    private String previewImageUrl;

    @Schema(description = "Source de la ressource : EXTERNAL ou UPLOADED")
    private String sourceType;

    @Schema(description = "Accès réservé aux utilisateurs premium")
    private boolean premium;

    @Schema(description = "Le téléchargement est autorisé")
    private boolean downloadable;

    @Schema(description = "Nombre total de vues")
    private long viewCount;

    @Schema(description = "Nombre total de téléchargements")
    private long downloadCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Tag associé à une ressource")
    public static class TagDto {
        @Schema(description = "ID du tag")
        private Long id;
        @Schema(description = "Nom du tag")
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Métadonnées d'une ressource")
    public static class ResourceMetadataDto {
        @Schema(description = "Taille du fichier en octets")
        private Long fileSize;
        @Schema(description = "Type MIME du fichier")
        private String mimeType;
    }
}
