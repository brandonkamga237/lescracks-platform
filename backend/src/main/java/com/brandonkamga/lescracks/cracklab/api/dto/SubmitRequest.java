package com.brandonkamga.lescracks.cracklab.api.dto;

import jakarta.validation.constraints.NotBlank;

public record SubmitRequest(@NotBlank String answer) {
}
