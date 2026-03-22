package com.brandonkamga.lescracks.dto;

import com.brandonkamga.lescracks.domain.ImageType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Réponse contenant les informations d'un asset image")
public class ImageAssetResponse {

    @Schema(description = "ID unique de l'image", example = "1")
    private Long id;

    @Schema(description = "URL de l'image")
    private String url;

    @Schema(description = "Type d'image")
    private ImageType imageType;

    @Schema(description = "Taille du fichier en octets")
    private Long fileSize;

    @Schema(description = "Type MIME")
    private String mimeType;

    @Schema(description = "ID de l'utilisateur associé")
    private Long userId;
}
