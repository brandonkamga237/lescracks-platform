package com.brandonkamga.lescracks.dto.newsletter;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BroadcastRequest(
        @NotBlank @Size(max = 200) String subject,
        @NotBlank @Size(max = 10000) String message) {
}