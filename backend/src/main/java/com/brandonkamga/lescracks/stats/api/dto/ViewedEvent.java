package com.brandonkamga.lescracks.stats.api.dto;

import java.time.Instant;

public record ViewedEvent(Long id, String slug, String title, Instant startDate,
                          String status, long views) {
}
