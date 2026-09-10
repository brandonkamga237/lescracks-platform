package com.brandonkamga.lescracks.dto.resource;

import com.brandonkamga.lescracks.domain.ResourceStatus;
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
        String kind,
        String videoUrl,
        String platform,
        String downloadUrl,
        String fileFormat,
        Long fileSize,
        Set<String> tags,
        Long likeCount,
        Instant createdAt,
        Instant updatedAt,
        JsonNode body,
        Integer readingMinutes) {
}
