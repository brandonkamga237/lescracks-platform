package com.brandonkamga.lescracks.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Demande de passage en compte PREMIUM")
public class PremiumRequestRequest {

    @NotBlank(message = "Le numéro WhatsApp est requis")
    @Schema(description = "Numéro WhatsApp pour être contacté", example = "+237600000000")
    private String whatsappNumber;

    @NotBlank(message = "L'email de contact est requis")
    @Email(message = "L'email de contact doit être valide")
    @Schema(description = "Email de contact pour les notifications (activation, expiration…)", example = "vous@gmail.com")
    private String contactEmail;

    @NotBlank(message = "Le pays est requis")
    @Schema(description = "Pays du demandeur", example = "Cameroun")
    private String country;

    @Schema(description = "Message optionnel")
    private String message;
}
