package com.brandonkamga.lescracks.content.api.dto;

import com.brandonkamga.lescracks.content.application.TalkDraft;
import com.brandonkamga.lescracks.content.domain.model.TalkStatus;

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

    public TalkDraft toDraft() {
        return new TalkDraft(title, description, guest, youtubeUrl, durationMinutes, publishedAt, status, coverImage);
    }
}
