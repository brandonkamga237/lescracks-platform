package com.brandonkamga.lescracks.newsletter.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SubscriberTest {

    @Test
    @DisplayName("a new address is normalised, pending, and gets its own unsubscribe token")
    void newAddress() {
        Subscriber subscriber = Subscriber.of(" Awa@Example.COM ", " Awa ", null);

        assertThat(subscriber.getEmail()).isEqualTo("awa@example.com");
        assertThat(subscriber.getFirstName()).isEqualTo("Awa");
        assertThat(subscriber.getStatus()).isEqualTo(SubscriptionStatus.PENDING);
        assertThat(subscriber.getToken()).hasSize(64).isNotEqualTo(Subscriber.of("b@example.com", null, null).getToken());
    }

    @Test
    @DisplayName("waiting for confirmation never downgrades a subscribed address")
    void awaitConfirmationKeepsSubscribers() {
        Subscriber subscriber = Subscriber.of("a@example.com", null, null);
        subscriber.subscribe();

        subscriber.awaitConfirmation();

        assertThat(subscriber.isSubscribed()).isTrue();
    }

    @Test
    @DisplayName("leaving records when; leaving twice keeps the first date")
    void unsubscribe() {
        Subscriber subscriber = Subscriber.of("a@example.com", null, null);
        subscriber.subscribe();
        subscriber.unsubscribe();
        var left = subscriber.getUnsubscribedAt();
        subscriber.unsubscribe();

        assertThat(subscriber.getStatus()).isEqualTo(SubscriptionStatus.UNSUBSCRIBED);
        assertThat(subscriber.getUnsubscribedAt()).isEqualTo(left).isNotNull();
    }
}
