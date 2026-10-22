package com.brandonkamga.lescracks.taxonomy.api.dto;

import com.brandonkamga.lescracks.taxonomy.domain.model.Tag;

public record TagResponse(Long id, String name) {

    public static TagResponse of(Tag tag) {
        return new TagResponse(tag.getId(), tag.getName());
    }
}
