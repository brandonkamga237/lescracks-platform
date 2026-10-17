package com.brandonkamga.lescracks.taxonomy.domain;

import com.brandonkamga.lescracks.taxonomy.api.dto.CategoryResponse;
import com.brandonkamga.lescracks.taxonomy.api.dto.TagResponse;

import org.springframework.stereotype.Component;

@Component
public class TaxonomyMapper {

    public CategoryResponse toResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getSlug(), category.getDescription());
    }

    public TagResponse toResponse(Tag tag) {
        return new TagResponse(tag.getId(), tag.getName());
    }
}
