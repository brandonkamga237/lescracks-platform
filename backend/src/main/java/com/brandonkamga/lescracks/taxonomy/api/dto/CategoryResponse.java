package com.brandonkamga.lescracks.taxonomy.api.dto;

/** A theme of the blog, also offered to members as an interest. */
public record CategoryResponse(Long id, String name, String slug, String description) {
}
