package com.brandonkamga.lescracks.recognition.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AwardRequest(@NotBlank @Email String email, @Size(max = 300) String reason) {
}
