package com.brandonkamga.lescracks.stats.api.dto;

public record WatchSignal(
        String key,
        String severity,
        String title,
        String detail,
        String actionLabel,
        String actionTo) {
}
