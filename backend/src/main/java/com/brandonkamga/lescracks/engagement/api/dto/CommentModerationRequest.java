package com.brandonkamga.lescracks.engagement.api.dto;

import com.brandonkamga.lescracks.engagement.domain.model.CommentStatus;

import jakarta.validation.constraints.NotNull;

public record CommentModerationRequest(@NotNull CommentStatus status) {
}
