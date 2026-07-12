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
@Schema(description = "Requête de connexion utilisateur")
public class LoginRequest {

    @Schema(description = "Adresse email de l'utilisateur", example = "user@exemple.com", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "L'adresse email est obligatoire.")
    @Email(message = "Format d'adresse email invalide.")
    private String email;

    @Schema(description = "Mot de passe de l'utilisateur", example = "password123", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Le mot de passe est obligatoire.")
    private String password;
}
