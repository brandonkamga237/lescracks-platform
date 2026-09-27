package com.brandonkamga.lescracks.stats.domain;

import com.brandonkamga.lescracks.stats.api.dto.AudienceResponse;
import com.brandonkamga.lescracks.stats.api.dto.ContentViewsResponse;
import com.brandonkamga.lescracks.stats.api.dto.StatsOverviewResponse;
import com.brandonkamga.lescracks.stats.api.dto.TopResourceResponse;
import com.brandonkamga.lescracks.stats.api.dto.UserGrowthPoint;
import com.brandonkamga.lescracks.stats.api.dto.WatchResponse;

import java.time.Instant;
import java.util.List;

public interface StatsService {
    StatsOverviewResponse overview();
    List<UserGrowthPoint> userGrowth(Instant from, Instant to);
    List<UserGrowthPoint> newsletterGrowth(Instant from, Instant to);
    List<TopResourceResponse> topResources(int limit);
    AudienceResponse audience(int days);
    ContentViewsResponse contentViews(int days);
    WatchResponse watch();
}
