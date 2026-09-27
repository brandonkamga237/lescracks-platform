package com.brandonkamga.lescracks.stats.api;

import com.brandonkamga.lescracks.stats.api.dto.AudienceResponse;
import com.brandonkamga.lescracks.stats.api.dto.ContentViewsResponse;
import com.brandonkamga.lescracks.stats.api.dto.StatsOverviewResponse;
import com.brandonkamga.lescracks.stats.api.dto.WatchResponse;
import com.brandonkamga.lescracks.stats.domain.StatsService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
public class StatsController {
    private final StatsService stats;

    public StatsController(StatsService stats) { this.stats = stats; }

    /** Every breakdown the dashboard needs, in one round trip. */
    @GetMapping("/overview")
    public StatsOverviewResponse overview() { return stats.overview(); }

    @GetMapping("/user-growth")
    public Map<String, Object> userGrowth(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return Map.of("from", from.toString(), "to", to.toString(),
                "points", stats.userGrowth(startOf(from), endOf(to)));
    }

    @GetMapping("/newsletter-growth")
    public Map<String, Object> newsletterGrowth(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return Map.of("from", from.toString(), "to", to.toString(),
                "points", stats.newsletterGrowth(startOf(from), endOf(to)));
    }

    @GetMapping("/top-resources")
    public Map<String, Object> topResources(@RequestParam(defaultValue = "5") int limit) {
        return Map.of("limit", limit, "resources", stats.topResources(limit));
    }

    /** Visitors, visits and pageviews from Umami, re-exposed in our own shape. */
    @GetMapping("/audience")
    public AudienceResponse audience(@RequestParam(defaultValue = "30") int days) {
        return stats.audience(days);
    }

    /** Pageviews per resource and per event, matched on their public slugs. */
    @GetMapping("/content-views")
    public ContentViewsResponse contentViews(@RequestParam(defaultValue = "30") int days) {
        return stats.contentViews(days);
    }

    /** Product signals worth an administrator's attention. */
    @GetMapping("/watch")
    public WatchResponse watch() { return stats.watch(); }

    private Instant startOf(LocalDate date) {
        return date.atStartOfDay(ZoneId.of("UTC")).toInstant();
    }

    private Instant endOf(LocalDate date) {
        return date.plusDays(1).atStartOfDay(ZoneId.of("UTC")).toInstant();
    }
}
