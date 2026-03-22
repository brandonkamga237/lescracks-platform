package com.brandonkamga.lescracks.dto;

import com.brandonkamga.lescracks.domain.ApplicationStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Réponse contenant les informations d'une candidature")
public class ApplicationResponse {

    @Schema(description = "ID unique de la candidature", example = "1")
    private Long id;

    @Schema(description = "ID de l'utilisateur")
    private Long userId;

    @Schema(description = "Nom d'utilisateur")
    private String username;

    @Schema(description = "ID de l'événement")
    private Long eventId;

    @Schema(description = "Titre de l'événement")
    private String eventTitle;

    @Schema(description = "ID du type de candidature")
    private Long applicationTypeId;

    @Schema(description = "Nom du type de candidature")
    private String applicationTypeName;

    @Schema(description = "Statut de la candidature")
    private ApplicationStatus status;

    @Schema(description = "Texte de motivation")
    private String motivationText;

    @Schema(description = "Niveau technique")
    private String technicalLevel;

    @Schema(description = "Date de création")
    private LocalDateTime createdAt;
}
