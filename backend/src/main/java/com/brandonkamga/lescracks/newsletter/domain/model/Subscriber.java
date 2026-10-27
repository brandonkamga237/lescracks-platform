package com.brandonkamga.lescracks.newsletter.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;

/**
 * An address on the newsletter list. {@code accountId} links it to a member when there is one;
 * a visitor who only left an address has none.
 */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class Subscriber {

    private static final SecureRandom RANDOM = new SecureRandom();

    private Long id;

    private Long accountId;

    private String email;

    private String firstName;

    private String lastName;

    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.PENDING;

    @Builder.Default
    private Instant subscribedAt = Instant.now();

    private Instant unsubscribedAt;

    /**
     * Put in every newsletter email to unsubscribe without signing in. Stored as is: it only ever
     * stops emails, so leaking it does less harm than losing the one-click link would.
     */
    @Builder.Default
    private String token = newToken();

    public static Subscriber of(String email, String firstName, String lastName) {
        return Subscriber.builder()
                .email(email.trim().toLowerCase())
                .firstName(firstName == null ? "" : firstName.trim())
                .lastName(lastName == null ? "" : lastName.trim())
                .build();
    }

    public void rename(String firstName, String lastName) {
        this.firstName = firstName == null ? "" : firstName.trim();
        this.lastName = lastName == null ? "" : lastName.trim();
    }

    public boolean isSubscribed() {
        return status == SubscriptionStatus.SUBSCRIBED;
    }

    public void subscribe() {
        status = SubscriptionStatus.SUBSCRIBED;
        unsubscribedAt = null;
    }

    /** Waits for the address to confirm; an address already subscribed stays subscribed. */
    public void awaitConfirmation() {
        if (status == SubscriptionStatus.SUBSCRIBED) return;
        status = SubscriptionStatus.PENDING;
        unsubscribedAt = null;
    }

    /** Only a pending address confirms: the link cannot resubscribe someone who left. */
    public void confirm() {
        if (status == SubscriptionStatus.PENDING) status = SubscriptionStatus.SUBSCRIBED;
    }

    public void unsubscribe() {
        if (status == SubscriptionStatus.UNSUBSCRIBED) return;
        status = SubscriptionStatus.UNSUBSCRIBED;
        unsubscribedAt = Instant.now();
    }

    private static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
