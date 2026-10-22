package com.brandonkamga.lescracks.engagement.api.dto;

import com.brandonkamga.lescracks.engagement.application.LikeStatus;

public record LikeStatusResponse(long count, boolean liked) {

    public static LikeStatusResponse of(LikeStatus status) {
        return new LikeStatusResponse(status.count(), status.liked());
    }
}
