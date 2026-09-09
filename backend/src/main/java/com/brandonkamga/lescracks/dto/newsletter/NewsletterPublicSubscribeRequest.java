package com.brandonkamga.lescracks.dto.newsletter;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NewsletterPublicSubscribeRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @Size(max = 120) String firstName,
        @Size(max = 120) String lastName
) {
}
