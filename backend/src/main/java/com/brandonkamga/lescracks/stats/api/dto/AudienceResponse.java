package com.brandonkamga.lescracks.stats.api.dto;

import java.util.List;

public record AudienceResponse(
        boolean available,
        int days,
        Long visitors,
        Long previousVisitors,
        Long visits,
        Long previousVisits,
        Long pageviews,
        Long previousPageviews,
        Double bounceRate,
        Long avgVisitSeconds,
        List<SeriesPoint> series,
        List<NamedCount> sources,
        List<NamedCount> countries,
        List<NamedCount> topPages,
        /** Custom events sent by the site (sign-up clicks, newsletter, WhatsApp, articles read to the end). */
        List<NamedCount> events) {

    public static AudienceResponse unavailable(int days) {
        return new AudienceResponse(false, days, null, null, null, null, null, null,
                null, null, List.of(), List.of(), List.of(), List.of(), List.of());
    }
}
