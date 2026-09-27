package com.brandonkamga.lescracks.stats.api.dto;

import java.util.List;

public record ContentViewsResponse(
        boolean available,
        int days,
        List<ViewedResource> resources,
        List<ViewedEvent> events) {

    public static ContentViewsResponse unavailable(int days) {
        return new ContentViewsResponse(false, days, List.of(), List.of());
    }
}
