package com.brandonkamga.lescracks.stats.api.dto;

import java.time.Instant;
import java.util.List;

/** What turns visits into members and members into participants, over the period. */
public record ConversionsResponse(int days, List<NamedCount> signupsBySource, List<NamedCount> signupsByLandingPage,
                                  List<EventFunnel> events) {

    /** One event from its page views to people who showed up or handed in a project. */
    public record EventFunnel(Long id, String slug, String title, Instant startDate, boolean acceptsSubmissions,
                              long views, long registrations, long attended, long projects) {
    }
}
