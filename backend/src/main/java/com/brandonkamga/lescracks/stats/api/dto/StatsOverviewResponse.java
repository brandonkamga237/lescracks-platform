package com.brandonkamga.lescracks.stats.api.dto;

import java.util.Map;

/**
 * {@code users} and its breakdowns count members (people who can sign in); {@code newsletterContacts}
 * are the addresses known only from the public newsletter form.
 */
public record StatsOverviewResponse(
        long users,
        Map<String, Long> usersByStatus,
        Map<String, Long> usersByProvider,
        long verifiedUsers,
        long usersNewLast30d,
        long usersActiveLast7d,
        long usersActiveLast30d,
        long newsletterContacts,
        SignupFunnel signupFunnel,
        long events,
        Map<String, Long> eventsByStatus,
        Map<String, Long> eventsByType,
        long eventsUpcoming,
        long eventsOngoing,
        long eventsPast,
        long resources,
        Map<String, Long> resourcesByStatus,
        Map<String, Long> resourcesByKind,
        Map<String, Long> resourcesByCategory,
        long newsletterSubscribers,
        long newsletterUnsubscribed,
        long newsletterNewLast30d,
        long talks,
        long talksPublished) {
}
