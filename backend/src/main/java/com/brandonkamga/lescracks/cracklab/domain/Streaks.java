package com.brandonkamga.lescracks.cracklab.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.TreeSet;

/**
 * Weekly streaks: weeks in a row with at least one answer, weeks running Monday to Sunday (UTC).
 * A streak whose last week is the previous one is still alive: the member has until Sunday.
 */
public final class Streaks {

    private Streaks() {
    }

    /** Monday-based week number since the epoch; 1970-01-01 was a Thursday, hence the +3. */
    static long week(Instant instant) {
        return Math.floorDiv(instant.atZone(ZoneOffset.UTC).toLocalDate().toEpochDay() + 3, 7);
    }

    public static int current(Collection<Instant> answers, Instant now) {
        TreeSet<Long> weeks = weeks(answers);
        long thisWeek = week(now);
        long cursor = weeks.contains(thisWeek) ? thisWeek : thisWeek - 1;
        int streak = 0;
        while (weeks.contains(cursor)) {
            streak++;
            cursor--;
        }
        return streak;
    }

    public static int best(Collection<Instant> answers) {
        int best = 0;
        int run = 0;
        Long previous = null;
        for (long week : weeks(answers)) {
            run = previous != null && week == previous + 1 ? run + 1 : 1;
            best = Math.max(best, run);
            previous = week;
        }
        return best;
    }

    public static boolean activeThisWeek(Collection<Instant> answers, Instant now) {
        return weeks(answers).contains(week(now));
    }

    /** Start of the current week (Monday 00:00 UTC), for the weekly ranking. */
    public static Instant weekStart(Instant now) {
        return LocalDate.ofEpochDay(week(now) * 7 - 3).atStartOfDay().toInstant(ZoneOffset.UTC);
    }

    private static TreeSet<Long> weeks(Collection<Instant> answers) {
        TreeSet<Long> weeks = new TreeSet<>();
        answers.forEach(answer -> weeks.add(week(answer)));
        return weeks;
    }
}
