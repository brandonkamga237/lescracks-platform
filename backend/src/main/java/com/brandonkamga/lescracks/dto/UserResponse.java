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
@Schema(description = "Réponse contenant les informations d'un utilisateur")
public class UserResponse {

    @Schema(description = "ID unique de l'utilisateur", example = "1")
    private Long id;

    @Schema(description = "Nom d'utilisateur", example = "johndoe")
    private String username;

    @Schema(description = "Adresse email", example = "johndoe@exemple.com")
    private String email;

    @Schema(description = "Numéro de téléphone", example = "+33 6 12 34 56 78")
    private String phone;

    @Schema(description = "Pays de l'utilisateur", example = "France")
    private String country;

    @Schema(description = "Nom du provider d'authentification", example = "LOCAL")
    private String providerName;

    @Schema(description = "ID utilisateur du provider externe")
    private String providerUserId;

    @Schema(description = "Rôle de l'utilisateur", example = "user")
    private String roleName;

    @Schema(description = "URL de la photo de profil")
    private String picture;

    @Schema(description = "Date d'activation PREMIUM")
    private LocalDateTime premiumActivatedAt;

    @Schema(description = "Date d'expiration PREMIUM")
    private LocalDateTime premiumExpiresAt;
}
