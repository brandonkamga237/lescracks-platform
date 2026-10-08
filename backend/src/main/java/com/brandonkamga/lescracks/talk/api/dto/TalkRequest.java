package com.brandonkamga.lescracks.talk.api.dto;

import com.brandonkamga.lescracks.talk.domain.TalkStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record TalkRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String description,
        @Size(max = 160) String guest,
        @NotBlank @Size(max = 1000) String youtubeUrl,
        Integer durationMinutes,
        Instant publishedAt,
        TalkStatus status,
        @Size(max = 1000) String coverImage) {
}
