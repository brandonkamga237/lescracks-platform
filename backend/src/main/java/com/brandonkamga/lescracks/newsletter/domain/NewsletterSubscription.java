package com.brandonkamga.lescracks.newsletter.domain;

import com.brandonkamga.lescracks.identity.domain.User;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;

/**
 * A user's subscription to the newsletter.
 *
 * One subscription per user, enforced by the unique user_id. The status tells
 * whether the user is currently subscribed or has unsubscribed.
 */
@Entity
@Table(name = "newsletter_subscriptions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsletterSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private NewsletterStatus status = NewsletterStatus.SUBSCRIBED;

    @Column(name = "subscribed_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant subscribedAt = Instant.now();

    @Column(name = "unsubscribed_at")
    private Instant unsubscribedAt;

    /**
     * Put in every newsletter email to unsubscribe without signing in. Stored as is: it only
     * ever stops emails, so leaking it does less harm than losing the one-click link would.
     */
    @Column(nullable = false, unique = true, length = 64)
    @Builder.Default
    private String token = randomToken();

    private static final SecureRandom RANDOM = new SecureRandom();

    private static String randomToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}