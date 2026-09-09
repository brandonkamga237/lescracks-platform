package com.brandonkamga.lescracks.dto.resource;

import com.brandonkamga.lescracks.domain.ResourceStatus;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record ArticleResourceRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String description,
        @Size(max = 500) String coverImage,
        @NotNull Long categoryId,
        Set<Long> tagIds,
        ResourceStatus status,
        @NotNull JsonNode body
) {
}
