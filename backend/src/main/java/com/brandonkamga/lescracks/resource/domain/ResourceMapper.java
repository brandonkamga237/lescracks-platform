package com.brandonkamga.lescracks.resource.domain;

import com.brandonkamga.lescracks.resource.api.dto.ResourceResponse;
import com.brandonkamga.lescracks.resource.infra.ArticleRepository;
import com.brandonkamga.lescracks.resource.infra.ResourceLikeRepository;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class ResourceMapper {
    private final ArticleRepository articles;
    private final ResourceLikeRepository likes;

    public ResourceMapper(ArticleRepository articles, ResourceLikeRepository likes) {
        this.articles = articles;
        this.likes = likes;
    }

    public ResourceResponse toResponse(Resource resource) {
        var article = articles.findByResourceId(resource.getId()).orElse(null);
        JsonNode body = article != null ? article.getBody() : null;
        Integer readingMinutes = article != null ? article.getReadingMinutes() : null;
        return new ResourceResponse(
                resource.getId(), resource.getSlug(), resource.getTitle(), resource.getDescription(), resource.getCoverImage(),
                resource.getStatus(), resource.getCategory().getId(), resource.getCategory().getName(),
                resource.getTags().stream().map(tag -> tag.getName()).collect(Collectors.toSet()),
                likes.countByResourceId(resource.getId()),
                resource.getCreatedAt(), resource.getUpdatedAt(),
                body, readingMinutes, resource.getScheduledAt(), resource.getPublishedAt());
    }
}
