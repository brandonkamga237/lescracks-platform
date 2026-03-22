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

    @NotBlank(message = "Current password is required")
    @Schema(description = "Mot de passe actuel", example = "oldPassword123")
    private String currentPassword;

    @NotBlank(message = "New password is required")
    @Size(min = 6, message = "New password must be at least 6 characters")
    @Schema(description = "Nouveau mot de passe", example = "newPassword456")
    private String newPassword;
}
