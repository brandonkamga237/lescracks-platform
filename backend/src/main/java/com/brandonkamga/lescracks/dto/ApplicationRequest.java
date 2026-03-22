package com.brandonkamga.lescracks.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Requête de candidature à un événement")
public class ApplicationRequest {

    @Schema(description = "ID de l'utilisateur", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "User ID is required")
    private Long userId;

    @Schema(description = "ID de l'événement (optionnel pour les demandes de service)", example = "1")
    private Long eventId;

    @Schema(description = "ID du type de candidature", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Application type ID is required")
    private Long applicationTypeId;

    @Schema(description = "Texte de motivation")
    private String motivationText;

    @Schema(description = "Niveau technique", example = "Débutant")
    private String technicalLevel;
}
