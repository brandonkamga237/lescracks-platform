package com.brandonkamga.lescracks.resource.api;

import com.brandonkamga.lescracks.resource.api.dto.ResourceResponse;
import com.brandonkamga.lescracks.resource.domain.Resource;
import com.brandonkamga.lescracks.resource.domain.ResourceLikeService;
import com.brandonkamga.lescracks.resource.domain.ResourceService;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class ResourceMapper {
    private final ResourceService resources;
    private final ResourceLikeService likes;

    public ResourceMapper(ResourceService resources, ResourceLikeService likes) {
        this.resources = resources;
        this.likes = likes;
    }

    public ResourceResponse toResponse(Resource resource) {
        return build(resource, true);
    }

    /** For lists: what a card shows, without the body, which weighs tens of kilobytes per article. */
    public ResourceResponse toSummary(Resource resource) {
        return build(resource, false);
    }

    private ResourceResponse build(Resource resource, boolean withBody) {
        var article = resources.article(resource.getId()).orElse(null);
        JsonNode body = withBody && article != null ? article.getBody() : null;
        Integer readingMinutes = article != null ? article.getReadingMinutes() : null;
        return new ResourceResponse(
                resource.getId(), resource.getSlug(), resource.getTitle(), resource.getDescription(), resource.getCoverImage(),
                resource.getStatus(), resource.getCategory().getId(), resource.getCategory().getName(),
                resource.getTags().stream().map(tag -> tag.getName()).collect(Collectors.toSet()),
                likes.countLikes(resource.getId()),
                resource.getViewCount(),
                resource.getCreatedAt(), resource.getUpdatedAt(),
                body, readingMinutes, resource.getScheduledAt(), resource.getPublishedAt());
    }
}
