package com.brandonkamga.lescracks.dto.newsletter;

import com.brandonkamga.lescracks.domain.NewsletterStatus;

import java.time.Instant;

public record AdminSubscriberResponse(Long userId, String email, String firstName, String lastName,
                                      NewsletterStatus status, Instant subscribedAt,
                                      Instant unsubscribedAt) {
}