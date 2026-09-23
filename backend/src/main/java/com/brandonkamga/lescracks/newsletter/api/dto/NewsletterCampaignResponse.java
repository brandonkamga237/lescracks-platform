package com.brandonkamga.lescracks.newsletter.api.dto;

import java.time.Instant;

public record NewsletterCampaignResponse(Long id, String subject, String message, int recipientCount, Instant sentAt) {
}
