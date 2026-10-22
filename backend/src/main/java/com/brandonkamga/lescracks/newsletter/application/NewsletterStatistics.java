package com.brandonkamga.lescracks.newsletter.application;

import com.brandonkamga.lescracks.newsletter.domain.model.SubscriptionStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

/** The figures the dashboard reads about the list, each computed by one SQL query. */
public interface NewsletterStatistics {

    long countByStatus(SubscriptionStatus status);

    long subscribedSince(Instant since);

    long unsubscribedSince(Instant since);

    /** Subscribers with no account behind them. */
    long countWithoutAccount();

    /** New subscriptions per day, in order. */
    Map<LocalDate, Long> growth(Instant from, Instant to);
}
