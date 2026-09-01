package com.brandonkamga.lescracks.dto;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Requête pour changer le mot de passe")
public class ChangePasswordRequest {

    @NotBlank(message = "Le mot de passe actuel est obligatoire.")
    @Schema(description = "Current password", example = "oldPassword123")
    private String currentPassword;

    @NotBlank(message = "Le nouveau mot de passe est obligatoire.")
    @Size(min = 8, message = "Le nouveau mot de passe doit contenir au moins 8 caractères.")
    @Schema(description = "New password (min 8 chars, must include uppercase, lowercase, digit and special character)", example = "NewPass@456")
    private String newPassword;
}
