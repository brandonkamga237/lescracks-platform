package com.brandonkamga.lescracks.dto.newsletter;

import java.time.Instant;

public record NewsletterCampaignResponse(Long id, String subject, String message, int recipientCount, Instant sentAt) {
}
