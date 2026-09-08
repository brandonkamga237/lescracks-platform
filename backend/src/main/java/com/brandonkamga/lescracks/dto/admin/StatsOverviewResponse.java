package com.brandonkamga.lescracks.dto.admin;

import java.util.Map;

public record StatsOverviewResponse(
        long users,
        Map<String, Long> usersByStatus,
        Map<String, Long> usersByProvider,
        long verifiedUsers,
        long events,
        Map<String, Long> eventsByStatus,
        Map<String, Long> eventsByType,
        long resources,
        Map<String, Long> resourcesByStatus,
        Map<String, Long> resourcesByKind,
        Map<String, Long> resourcesByCategory,
        long newsletterSubscribers,
        long newsletterUnsubscribed) {
}
