package com.brandonkamga.lescracks.event.domain.model;

/**
 * Which events a list shows; null means "any". Public lists show rendez-vous only: a hackathon
 * keeps its page, but no longer appears among them.
 */
public record EventSearch(EventStatus status, EventType type, EventFormat format, Timing timing, boolean newestFirst,
                          boolean rendezVousOnly) {

    /** Relative to now: not over yet (a two-week hackathon stays ahead of its participants), or over. */
    public enum Timing { ANY, UPCOMING, PAST }

    public static EventSearch published(EventType type, EventFormat format) {
        return new EventSearch(EventStatus.PUBLISHED, type, format, Timing.ANY, false, true);
    }

    public static EventSearch upcoming() {
        return new EventSearch(EventStatus.PUBLISHED, null, null, Timing.UPCOMING, false, true);
    }

    public static EventSearch past() {
        return new EventSearch(EventStatus.PUBLISHED, null, null, Timing.PAST, true, true);
    }

    public static EventSearch backOffice() {
        return new EventSearch(null, null, null, Timing.ANY, true, false);
    }
}
