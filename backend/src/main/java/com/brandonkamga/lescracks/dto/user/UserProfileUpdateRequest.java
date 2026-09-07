package com.brandonkamga.lescracks.dto.user;

import jakarta.validation.constraints.NotBlank;

public record UserProfileUpdateRequest(@NotBlank String firstName, @NotBlank String lastName) {
}