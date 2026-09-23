package com.brandonkamga.lescracks.identity.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserRegisterRequest(
        @Email(message = "L'adresse email est invalide.") @NotBlank String email,
        @NotBlank @Size(min = 10, message = "Le mot de passe doit contenir au moins 10 caractères.") String password,
        @NotBlank String firstName,
        @NotBlank String lastName) {
}