package com.brandonkamga.lescracks.event.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistrantMessageRequest(@NotBlank @Size(max = 2000) String message) {
}
