package com.brandonkamga.lescracks.dto.resource;

import com.brandonkamga.lescracks.domain.ResourceKind;
import com.brandonkamga.lescracks.dto.media.MediaResponse;
import com.brandonkamga.lescracks.dto.taxonomy.TagResponse;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

/**
 * A catalogue card. Everything a list needs and nothing a page would.
 *
 * Notably not the body: sending every article's text to draw a grid of titles would be the
 * difference between a fast page and a slow one.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ResourceSummary(
        Long id,
        String slug,
        ResourceKind kind,
        String title,
        String summary,
        MediaResponse cover,
        String categoryName,
        List<TagResponse> tags,
        long viewCount,
        boolean published,
        Instant createdAt) {
}
