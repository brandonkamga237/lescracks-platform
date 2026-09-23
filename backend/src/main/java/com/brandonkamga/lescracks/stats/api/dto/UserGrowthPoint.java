package com.brandonkamga.lescracks.stats.api.dto;

import java.time.LocalDate;

public record UserGrowthPoint(LocalDate date, long count) {
}
