package com.brandonkamga.lescracks.mapper;

import com.brandonkamga.lescracks.domain.Category;
import com.brandonkamga.lescracks.domain.Tag;
import com.brandonkamga.lescracks.dto.taxonomy.CategoryResponse;
import com.brandonkamga.lescracks.dto.taxonomy.TagResponse;
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
