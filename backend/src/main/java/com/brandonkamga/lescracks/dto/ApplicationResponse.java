package com.brandonkamga.lescracks.dto;

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

    @Schema(description = "ID unique de la candidature")
    private Long id;

    // Champs utilisateur (peut être null si candidature publique)
    @Schema(description = "ID de l'utilisateur (null si candidature publique)")
    private Long userId;

    @Schema(description = "Nom d'utilisateur du compte (null si candidature publique)")
    private String username;

    @Schema(description = "ID de l'événement")
    private Long eventId;

    @Schema(description = "Titre de l'événement")
    private String eventTitle;

    @Schema(description = "ID du type de candidature")
    private Long applicationTypeId;

    @Schema(description = "Nom du type de candidature")
    private String applicationTypeName;

    @Schema(description = "True s'il s'agit d'une inscription à un événement, false pour l'Accompagnement 360")
    private boolean eventRegistration;

    @Schema(description = "Archivée ou active")
    private boolean archived;

    @Schema(description = "Date d'archivage (null si active)")
    private LocalDateTime archivedAt;

    // Champs du formulaire public
    @Schema(description = "Nom complet du candidat")
    private String fullName;

    @Schema(description = "Email du candidat")
    private String emailAddress;

    @Schema(description = "Numéro WhatsApp")
    private String whatsappNumber;

    @Schema(description = "Âge (optionnel)")
    private Integer age;

    @Schema(description = "Texte de motivation")
    private String motivationText;

    @Schema(description = "Niveau technique")
    private String technicalLevel;

    @Schema(description = "Date de création")
    private LocalDateTime createdAt;
}
