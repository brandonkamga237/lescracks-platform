package com.brandonkamga.lescracks.newsletter.api.dto;

import com.brandonkamga.lescracks.newsletter.domain.NewsletterStatus;

import java.time.Instant;

public record NewsletterResponse(NewsletterStatus status, Instant subscribedAt, Instant unsubscribedAt) {
}