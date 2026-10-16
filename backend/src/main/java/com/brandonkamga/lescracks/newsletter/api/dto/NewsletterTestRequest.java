package com.brandonkamga.lescracks.newsletter.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** A campaign sent to one address before it goes to the subscribers. */
public record NewsletterTestRequest(
        @NotBlank @Size(max = 200) String subject,
        @NotNull JsonNode body,
        @NotBlank @Email(message = "L'adresse email est invalide.") String email) {
}
