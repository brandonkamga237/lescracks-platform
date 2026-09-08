package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.dto.admin.StatsOverviewResponse;
import com.brandonkamga.lescracks.service.interfaces.StatsService;
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
        Instant fromInstant = from.atStartOfDay(ZoneId.of("UTC")).toInstant();
        Instant toInstant = to.plusDays(1).atStartOfDay(ZoneId.of("UTC")).toInstant();
        return Map.of("from", from.toString(), "to", to.toString(),
                "points", stats.userGrowth(fromInstant, toInstant));
    }

    @GetMapping("/top-resources")
    public Map<String, Object> topResources(@RequestParam(defaultValue = "5") int limit) {
        return Map.of("limit", limit, "resources", stats.topResources(limit));
    }
}
