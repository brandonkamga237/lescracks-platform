package com.brandonkamga.lescracks.dto.admin;

import java.util.Map;

public record StatsOverviewResponse(
        long users,
        Map<String, Long> usersByStatus,
        long events,
        Map<String, Long> eventsByStatus,
        long resources,
        Map<String, Long> resourcesByStatus,
        long newsletterSubscribers,
        long newsletterUnsubscribed) {
}