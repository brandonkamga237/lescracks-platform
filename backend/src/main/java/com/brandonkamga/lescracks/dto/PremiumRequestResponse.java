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
@Schema(description = "Détails d'une demande PREMIUM")
public class PremiumRequestResponse {

    @Schema(description = "ID de la demande")
    private Long id;

    @Schema(description = "ID de l'utilisateur")
    private Long userId;

    @Schema(description = "Nom d'utilisateur")
    private String username;

    @Schema(description = "Email de l'utilisateur")
    private String email;

    @Schema(description = "Numéro WhatsApp")
    private String whatsappNumber;

    @Schema(description = "Pays")
    private String country;

    @Schema(description = "Message optionnel")
    private String message;

    @Schema(description = "Statut de la demande", example = "PENDING")
    private String status;

    @Schema(description = "Date de création de la demande")
    private LocalDateTime createdAt;
}
