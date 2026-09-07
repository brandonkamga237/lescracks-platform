package com.brandonkamga.lescracks.dto.newsletter;

import com.brandonkamga.lescracks.domain.NewsletterStatus;

import java.time.Instant;

public record NewsletterResponse(NewsletterStatus status, Instant subscribedAt, Instant unsubscribedAt) {
}