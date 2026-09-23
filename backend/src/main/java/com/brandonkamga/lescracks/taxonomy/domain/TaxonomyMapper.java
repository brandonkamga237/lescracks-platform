package com.brandonkamga.lescracks.taxonomy.domain;

import com.brandonkamga.lescracks.taxonomy.api.dto.CategoryResponse;
import com.brandonkamga.lescracks.taxonomy.api.dto.TagResponse;

import org.springframework.stereotype.Component;

@Component
public class TaxonomyMapper {

    public CategoryResponse toResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName());
    }

    /** The category name travels with the tag: a tag without it is unreadable in a filter list. */
    public TagResponse toResponse(Tag tag) {
        return new TagResponse(
                tag.getId(),
                tag.getName(),
                tag.getCategory().getId(),
                tag.getCategory().getName());
    }
}
