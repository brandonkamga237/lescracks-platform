package com.brandonkamga.lescracks.talk.api.dto;

import com.brandonkamga.lescracks.talk.domain.TalkStatus;

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
        Instant updatedAt) {
}
