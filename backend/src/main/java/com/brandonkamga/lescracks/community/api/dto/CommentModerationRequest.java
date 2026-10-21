package com.brandonkamga.lescracks.community.api.dto;

import com.brandonkamga.lescracks.community.domain.CommentStatus;

import jakarta.validation.constraints.NotNull;

public record CommentModerationRequest(@NotNull CommentStatus status) {
}
