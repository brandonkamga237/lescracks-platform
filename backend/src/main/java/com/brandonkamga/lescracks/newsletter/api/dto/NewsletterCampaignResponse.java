package com.brandonkamga.lescracks.newsletter.api.dto;

import com.brandonkamga.lescracks.newsletter.domain.model.Campaign;

import java.time.Instant;

public record NewsletterCampaignResponse(Long id, String subject, String message, int recipientCount, Instant sentAt) {

    public static NewsletterCampaignResponse of(Campaign campaign) {
        return new NewsletterCampaignResponse(campaign.getId(), campaign.getSubject(), campaign.getMessage(),
                campaign.getRecipientCount(), campaign.getSentAt());
    }
}
