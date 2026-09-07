package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.dto.admin.StatsOverviewResponse;
import com.brandonkamga.lescracks.service.interfaces.StatsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
public class StatsController {
    private final StatsService stats;

    public StatsController(StatsService stats) { this.stats = stats; }

    @GetMapping("/overview")
    public StatsOverviewResponse overview() { return stats.overview(); }

    @GetMapping("/users")
    public Map<String, Object> users() {
        StatsOverviewResponse value = stats.overview();
        return Map.of("total", value.users(), "byStatus", value.usersByStatus());
    }

    @GetMapping("/events")
    public Map<String, Object> events() {
        StatsOverviewResponse value = stats.overview();
        return Map.of("total", value.events(), "byStatus", value.eventsByStatus());
    }

    @GetMapping("/resources")
    public Map<String, Object> resources() {
        StatsOverviewResponse value = stats.overview();
        return Map.of("total", value.resources(), "byStatus", value.resourcesByStatus());
    }
}