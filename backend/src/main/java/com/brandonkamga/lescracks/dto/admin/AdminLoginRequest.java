package com.brandonkamga.lescracks.dto.admin;

import jakarta.validation.constraints.NotBlank;

public record AdminLoginRequest(
        @NotBlank(message = "Le nom d'utilisateur est obligatoire.") String username,
        @NotBlank(message = "Le mot de passe est obligatoire.") String password) {
}