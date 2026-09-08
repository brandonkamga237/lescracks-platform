package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.dto.admin.StatsOverviewResponse;
import com.brandonkamga.lescracks.dto.admin.TopResourceResponse;
import com.brandonkamga.lescracks.dto.admin.UserGrowthPoint;

import java.time.Instant;
import java.util.List;

public interface StatsService {
    StatsOverviewResponse overview();
    List<UserGrowthPoint> userGrowth(Instant from, Instant to);
    List<TopResourceResponse> topResources(int limit);
}
