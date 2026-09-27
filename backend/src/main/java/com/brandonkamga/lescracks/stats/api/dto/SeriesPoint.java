package com.brandonkamga.lescracks.stats.api.dto;

import java.time.LocalDate;

public record SeriesPoint(LocalDate date, long pageviews, long visits) {
}
