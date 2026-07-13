package com.brandonkamga.lescracks.dto;

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
@Schema(description = "Requête de candidature")
public class ApplicationRequest {

    @Schema(description = "ID de l'utilisateur (optionnel — candidature publique possible)", example = "1")
    private Long userId;

    @Schema(description = "ID de l'événement (optionnel)", example = "1")
    private Long eventId;

    @Schema(description = "ID du type de candidature", example = "4", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Application type ID is required")
    private Long applicationTypeId;

    @Schema(description = "Nom complet du candidat", example = "Jean Dupont")
    // Validated in the controller, not here: a public application must supply these,
    // but an event sign-up is authenticated, so we already know the person.
    private String fullName;

    @Schema(description = "Email du candidat", example = "jean@example.com")
    private String emailAddress;

    @Schema(description = "Numéro WhatsApp", example = "+237600000000")
    private String whatsappNumber;

    @Schema(description = "Âge (optionnel)", example = "22")
    private Integer age;

    @Schema(description = "Texte de motivation / présentation")
    private String motivationText;

    @Schema(description = "Niveau technique", example = "Débutant")
    private String technicalLevel;
}
