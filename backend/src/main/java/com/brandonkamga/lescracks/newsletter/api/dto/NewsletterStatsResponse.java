package com.brandonkamga.lescracks.newsletter.api.dto;

/** {@code pending}: signed up from the public form, address not confirmed yet. */
public record NewsletterStatsResponse(long subscribed, long unsubscribed, long pending) {
}
