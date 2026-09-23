package com.brandonkamga.lescracks.resource.domain;

import com.brandonkamga.lescracks.resource.api.dto.ResourceResponse;
import com.brandonkamga.lescracks.resource.infra.ArticleRepository;
import com.brandonkamga.lescracks.resource.infra.EbookRepository;
import com.brandonkamga.lescracks.resource.infra.ExternalVideoReferenceRepository;
import com.brandonkamga.lescracks.resource.infra.ResourceLikeRepository;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class ResourceMapper {
    private final EbookRepository ebooks;
    private final ExternalVideoReferenceRepository videos;
    private final ArticleRepository articles;
    private final ResourceLikeRepository likes;

    public ResourceMapper(EbookRepository ebooks, ExternalVideoReferenceRepository videos,
                          ArticleRepository articles, ResourceLikeRepository likes) {
        this.ebooks = ebooks;
        this.videos = videos;
        this.articles = articles;
        this.likes = likes;
    }

    public ResourceResponse toResponse(Resource resource) {
        var ebook = ebooks.findByResourceId(resource.getId()).orElse(null);
        var video = videos.findByResourceId(resource.getId()).orElse(null);
        var article = articles.findByResourceId(resource.getId()).orElse(null);
        String kind;
        if (ebook != null) kind = "EBOOK";
        else if (video != null) kind = "EXTERNAL_VIDEO";
        else if (article != null) kind = "ARTICLE";
        else kind = "UNKNOWN";
        JsonNode body = article != null ? article.getBody() : null;
        Integer readingMinutes = article != null ? article.getReadingMinutes() : null;
        return new ResourceResponse(
                resource.getId(), resource.getSlug(), resource.getTitle(), resource.getDescription(), resource.getCoverImage(),
                resource.getStatus(), resource.getCategory().getId(), resource.getCategory().getName(), kind,
                video == null ? null : video.getVideoUrl(), video == null ? null : video.getPlatform(),
                ebook == null ? null : "/api/resources/" + resource.getId() + "/download",
                ebook == null ? null : ebook.getDocument().getFormat(),
                ebook == null ? null : ebook.getDocument().getFileSize(),
                resource.getTags().stream().map(tag -> tag.getName()).collect(Collectors.toSet()),
                likes.countByResourceId(resource.getId()),
                resource.getCreatedAt(), resource.getUpdatedAt(),
                body, readingMinutes);
    }
}
