package com.brandonkamga.lescracks.dto.resource;

import com.brandonkamga.lescracks.domain.ResourceStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record VideoResourceRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String description,
        @Size(max = 500) String coverImage,
        @NotNull Long categoryId,
        Set<Long> tagIds,
        @NotBlank @Size(max = 1000) String videoUrl,
        @NotBlank @Size(max = 50) String platform,
        ResourceStatus status) {
}
