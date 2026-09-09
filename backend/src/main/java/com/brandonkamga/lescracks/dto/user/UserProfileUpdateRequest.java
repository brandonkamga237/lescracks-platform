package com.brandonkamga.lescracks.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record UserProfileUpdateRequest(
        @NotBlank @Size(max = 120) String firstName,
        @NotBlank @Size(max = 120) String lastName,
        @Size(max = 50) String username,
        @Size(max = 255) String avatarUrl,
        @Size(max = 2000) String bio,
        @Size(max = 100) String location,
        Map<String, String> socialLinks
) {
}
