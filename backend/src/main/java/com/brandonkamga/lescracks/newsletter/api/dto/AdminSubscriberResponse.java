package com.brandonkamga.lescracks.newsletter.api.dto;

import com.brandonkamga.lescracks.newsletter.domain.model.Subscriber;
import com.brandonkamga.lescracks.newsletter.domain.model.SubscriptionStatus;

import java.time.Instant;

/** {@code accountId} is null for a visitor who only left an address. */
public record AdminSubscriberResponse(Long id, Long accountId, String email, String firstName, String lastName,
                                      SubscriptionStatus status, Instant subscribedAt, Instant unsubscribedAt) {

    public static AdminSubscriberResponse of(Subscriber subscriber) {
        return new AdminSubscriberResponse(subscriber.getId(), subscriber.getAccountId(), subscriber.getEmail(),
                subscriber.getFirstName(), subscriber.getLastName(), subscriber.getStatus(),
                subscriber.getSubscribedAt(), subscriber.getUnsubscribedAt());
    }
}
