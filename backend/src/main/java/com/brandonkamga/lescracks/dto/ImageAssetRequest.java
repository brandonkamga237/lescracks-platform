package com.brandonkamga.lescracks.dto;

import com.brandonkamga.lescracks.domain.ImageType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Requête de création/mise à jour d'un asset image")
public class ImageAssetRequest {

    @Schema(description = "URL de l'image", example = "https://exemple.com/image.jpg", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "URL is required")
    private String url;

    @Schema(description = "Type d'image", example = "PROFILE", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Image type is required")
    private ImageType imageType;

    @Schema(description = "Taille du fichier en octets")
    private Long fileSize;

    @Schema(description = "Type MIME", example = "image/jpeg")
    private String mimeType;

    @Schema(description = "ID de l'utilisateur associé (optionnel)")
    private Long userId;
}
