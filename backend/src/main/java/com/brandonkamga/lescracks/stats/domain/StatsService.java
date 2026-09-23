package com.brandonkamga.lescracks.stats.domain;

import com.brandonkamga.lescracks.stats.api.dto.StatsOverviewResponse;
import com.brandonkamga.lescracks.stats.api.dto.TopResourceResponse;
import com.brandonkamga.lescracks.stats.api.dto.UserGrowthPoint;

import java.time.Instant;
import java.util.List;

public interface StatsService {
    StatsOverviewResponse overview();
    List<UserGrowthPoint> userGrowth(Instant from, Instant to);
    List<TopResourceResponse> topResources(int limit);
}
