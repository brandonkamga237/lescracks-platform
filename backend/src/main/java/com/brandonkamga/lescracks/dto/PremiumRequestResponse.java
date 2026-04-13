package com.brandonkamga.lescracks.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Détails d'une demande PREMIUM en attente")
public class PremiumRequestResponse {

    @Schema(description = "ID de la demande")
    private Long id;

    @Schema(description = "ID de l'utilisateur")
    private Long userId;

    @Schema(description = "Nom d'utilisateur")
    private String username;

    @Schema(description = "Email du compte")
    private String email;

    @Schema(description = "Numéro WhatsApp de contact")
    private String whatsappNumber;

    @Schema(description = "Email de contact pour les notifications")
    private String contactEmail;

    @Schema(description = "Pays")
    private String country;

    @Schema(description = "Message optionnel")
    private String message;

    @Schema(description = "Date de soumission de la demande")
    private LocalDateTime createdAt;
}
