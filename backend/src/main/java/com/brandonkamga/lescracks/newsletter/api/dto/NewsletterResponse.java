package com.brandonkamga.lescracks.newsletter.api.dto;

import com.brandonkamga.lescracks.newsletter.domain.model.Subscriber;
import com.brandonkamga.lescracks.newsletter.domain.model.SubscriptionStatus;

import java.time.Instant;

public record NewsletterResponse(SubscriptionStatus status, Instant subscribedAt, Instant unsubscribedAt) {

    public static NewsletterResponse of(Subscriber subscriber) {
        return new NewsletterResponse(subscriber.getStatus(), subscriber.getSubscribedAt(), subscriber.getUnsubscribedAt());
    }
}
