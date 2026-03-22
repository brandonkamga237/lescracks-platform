package com.brandonkamga.lescracks.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Réponse d'authentification contenant le token JWT")
public class AuthResponse {

    @Schema(description = "Token JWT d'accès", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String accessToken;

    @Schema(description = "Type de token", example = "Bearer")
    private String tokenType;

    @Schema(description = "Informations de l'utilisateur")
    private UserResponse user;

    public static AuthResponse of(String accessToken, UserResponse user) {
        return new AuthResponse(accessToken, "Bearer", user);
    }
}
