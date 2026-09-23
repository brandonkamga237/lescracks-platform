package com.brandonkamga.lescracks.newsletter.api.dto;

import com.brandonkamga.lescracks.newsletter.domain.NewsletterStatus;

import java.time.Instant;

public record AdminSubscriberResponse(Long userId, String email, String firstName, String lastName,
                                      NewsletterStatus status, Instant subscribedAt,
                                      Instant unsubscribedAt) {
}