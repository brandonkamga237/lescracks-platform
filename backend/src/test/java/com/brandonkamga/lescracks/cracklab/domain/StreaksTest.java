package com.brandonkamga.lescracks.cracklab.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class StreaksTest {

    // Wednesday 2026-10-07; its week runs Monday 2026-10-05 to Sunday 2026-10-11.
    private static final Instant NOW = Instant.parse("2026-10-07T12:00:00Z");

    private static Instant day(String date) {
        return Instant.parse(date + "T10:00:00Z");
    }

    @Test
    @DisplayName("consecutive weeks up to this one make the current streak")
    void countsConsecutiveWeeks() {
        List<Instant> answers = List.of(day("2026-10-06"), day("2026-09-30"), day("2026-09-22"), day("2026-09-01"));

        assertThat(Streaks.current(answers, NOW)).isEqualTo(3);
        assertThat(Streaks.activeThisWeek(answers, NOW)).isTrue();
    }

    @Test
    @DisplayName("a streak that ended last week is still alive until Sunday")
    void lastWeekKeepsTheStreakAlive() {
        List<Instant> answers = List.of(day("2026-10-01"), day("2026-09-24"));

        assertThat(Streaks.current(answers, NOW)).isEqualTo(2);
        assertThat(Streaks.activeThisWeek(answers, NOW)).isFalse();
    }

    @Test
    @DisplayName("a missed week breaks the streak; the best run is remembered")
    void missedWeekBreaksIt() {
        List<Instant> answers = List.of(day("2026-09-22"), day("2026-09-15"), day("2026-09-08"), day("2026-09-01"));

        assertThat(Streaks.current(answers, NOW)).isZero();
        assertThat(Streaks.best(answers)).isEqualTo(4);
    }

    @Test
    @DisplayName("two answers in the same week count once")
    void sameWeekCountsOnce() {
        assertThat(Streaks.best(List.of(day("2026-10-05"), day("2026-10-11")))).isEqualTo(1);
    }

    @Test
    @DisplayName("the weekly board starts on Monday at midnight UTC")
    void weekStartsOnMonday() {
        assertThat(Streaks.weekStart(NOW)).isEqualTo(Instant.parse("2026-10-05T00:00:00Z"));
        assertThat(Streaks.weekStart(Instant.parse("2026-10-05T00:00:00Z"))).isEqualTo(Instant.parse("2026-10-05T00:00:00Z"));
    }
}
