package com.brandonkamga.lescracks.content.application;

import com.brandonkamga.lescracks.content.domain.model.TalkStatus;

import java.time.Instant;

public record TalkDraft(String title, String description, String guest, String youtubeUrl, Integer durationMinutes,
                        Instant publishedAt, TalkStatus status, String coverImage) {
}
