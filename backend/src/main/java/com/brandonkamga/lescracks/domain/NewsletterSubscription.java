package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

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
}