package com.brandonkamga.lescracks.content.api.dto;

import com.brandonkamga.lescracks.content.application.ArticleView;
import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.content.domain.model.ArticleStatus;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

/** An article as the blog and the back office read it; cards come without their body. */
public record ArticleResponse(
        Long id,
        String slug,
        String title,
        String description,
        String coverImage,
        ArticleStatus status,
        Long categoryId,
        String categoryName,
        Set<String> tags,
        Long likeCount,
        Integer viewCount,
        Instant createdAt,
        Instant updatedAt,
        JsonNode body,
        Integer readingMinutes,
        Instant scheduledAt,
        Instant publishedAt) {

    public static ArticleResponse of(ArticleView view) {
        Article article = view.article();
        Counts counts = view.counts() == null ? Counts.NONE : view.counts();
        return new ArticleResponse(
                article.getId(), article.getSlug(), article.getTitle(), article.getDescription(), article.getCoverImage(),
                article.getStatus(), article.getCategoryId(), view.category() == null ? null : view.category().getName(),
                new LinkedHashSet<>(view.tags()), (long) counts.likes(), counts.views(),
                article.getCreatedAt(), article.getUpdatedAt(), article.getBody(), article.getReadingMinutes(),
                article.getScheduledAt(), article.getPublishedAt());
    }
}
