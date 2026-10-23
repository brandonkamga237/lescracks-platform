package com.brandonkamga.lescracks.event.application;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/** The figures the dashboard reads about events, each computed by one SQL query. */
public interface EventStatistics {

    /** What the dashboard shows of an event it ranks or flags. */
    record EventCard(Long id, String slug, String title, Instant startDate, String status) {
    }

    /** Published events relative to a day: not started, running that day, or over before it. */
    record Timing(long upcoming, long ongoing, long past) {
    }

    /** How far people went with an event, from signing up to showing up or handing in a project. */
    record EventFunnel(Long id, String slug, String title, Instant startDate, boolean acceptsSubmissions,
                       long registrations, long attended, long projects) {
    }

    /** Published or finished events, the latest first. */
    List<EventFunnel> funnels(int limit);

    Map<String, Long> eventsByStatus();

    Map<String, Long> eventsByType();

    /** An event without an end runs on the day it starts. */
    Timing publishedTiming(Instant now, Instant todayStart);

    /** By the last segment of their page URL, a slug or the numeric id older links carry; unknown ones are absent. */
    List<EventCard> eventsByPathKey(Collection<String> keys);

    /** Published, starting in the window, soonest first. */
    List<EventCard> publishedStartingBetween(Instant from, Instant to, int limit);
}
