package com.brandonkamga.lescracks.newsletter.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.Size;

public record NewsletterPreviewRequest(@Size(max = 200) String subject, JsonNode body) {
}
