package com.brandonkamga.lescracks.content.api.dto;

import com.brandonkamga.lescracks.content.application.ArticleDraft;
import com.brandonkamga.lescracks.content.domain.model.ArticleStatus;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Set;

public record ArticleRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String description,
        @Size(max = 1000) String coverImage,
        @NotNull Long categoryId,
        Set<Long> tagIds,
        ArticleStatus status,
        @NotNull JsonNode body,
        Instant scheduledAt
) {

    public ArticleDraft toDraft() {
        return new ArticleDraft(title, description, coverImage, categoryId, tagIds, status, body, scheduledAt);
    }
}
