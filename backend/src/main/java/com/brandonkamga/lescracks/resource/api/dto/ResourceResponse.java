package com.brandonkamga.lescracks.resource.api.dto;

import com.brandonkamga.lescracks.resource.domain.ResourceStatus;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.Set;

public record ResourceResponse(
        Long id,
        String slug,
        String title,
        String description,
        String coverImage,
        ResourceStatus status,
        Long categoryId,
        String categoryName,
        Set<String> tags,
        Long likeCount,
        Instant createdAt,
        Instant updatedAt,
        JsonNode body,
        Integer readingMinutes,
        Instant scheduledAt,
        Instant publishedAt) {
}
