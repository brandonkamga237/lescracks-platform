package com.brandonkamga.lescracks.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Requête de création/mise à jour d'utilisateur")
public class UserRequest {

    @Schema(description = "Nom d'utilisateur unique", example = "johndoe", minLength = 3, maxLength = 50)
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @Schema(description = "Adresse email unique", example = "johndoe@exemple.com", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @Email(message = "Email should be valid")
    private String email;

    @Schema(description = "Mot de passe (minimum 6 caractères)", example = "password123", minLength = 6)
    private String password;

    @Schema(description = "Nom du rôle", example = "user")
    private String roleName;

    @Schema(description = "Numéro de téléphone", example = "+33 6 12 34 56 78")
    private String phone;

    @Schema(description = "Pays de l'utilisateur", example = "France", maxLength = 100)
    @Size(max = 100, message = "Country must not exceed 100 characters")
    private String country;

    @Schema(description = "Nom du provider d'authentification", example = "LOCAL")
    private String providerName;

    @Schema(description = "ID utilisateur du provider externe")
    private String providerUserId;
}
