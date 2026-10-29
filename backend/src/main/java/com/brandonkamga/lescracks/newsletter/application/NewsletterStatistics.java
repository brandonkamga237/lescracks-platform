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

    /**
     * Confirmed subscriptions per UTC day, in order, counting those who left since: with
     * {@link #unsubscriptions} it gives the net change of the list. Days without one are absent.
     */
    Map<LocalDate, Long> growth(Instant from, Instant to);

    /** Unsubscriptions per UTC day, in order; days without one are absent. */
    Map<LocalDate, Long> unsubscriptions(Instant from, Instant to);
}
