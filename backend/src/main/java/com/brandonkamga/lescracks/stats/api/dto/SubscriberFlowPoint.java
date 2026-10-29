package com.brandonkamga.lescracks.stats.api.dto;

import java.time.LocalDate;

/** One day of the newsletter list: who joined and who left, so the net change is joined - left. */
public record SubscriberFlowPoint(LocalDate date, long joined, long left) {
}
