package com.brandonkamga.lescracks.content.api.dto;

import com.brandonkamga.lescracks.content.domain.model.Talk;
import com.brandonkamga.lescracks.content.domain.model.TalkStatus;

import java.time.Instant;

public record TalkResponse(
        Long id,
        String title,
        String description,
        String guest,
        String youtubeUrl,
        Integer durationMinutes,
        Instant publishedAt,
        TalkStatus status,
        Instant createdAt,
        Instant updatedAt,
        String coverImage) {

    public static TalkResponse of(Talk talk) {
        return new TalkResponse(talk.getId(), talk.getTitle(), talk.getDescription(), talk.getGuest(), talk.getYoutubeUrl(),
                talk.getDurationMinutes(), talk.getPublishedAt(), talk.getStatus(), talk.getCreatedAt(), talk.getUpdatedAt(),
                talk.getCoverImage());
    }
}
