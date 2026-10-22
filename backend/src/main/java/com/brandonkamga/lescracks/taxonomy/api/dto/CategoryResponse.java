package com.brandonkamga.lescracks.taxonomy.api.dto;

import com.brandonkamga.lescracks.taxonomy.domain.model.Category;

/** A theme of the blog, also offered to members as an interest. */
public record CategoryResponse(Long id, String name, String slug, String description) {

    public static CategoryResponse of(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getSlug(), category.getDescription());
    }
}
