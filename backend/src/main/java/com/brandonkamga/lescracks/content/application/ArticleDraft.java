package com.brandonkamga.lescracks.content.application;

import com.brandonkamga.lescracks.content.domain.model.ArticleStatus;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.Set;

/** What an admin writes for an article: its card, its body and when it goes public. */
public record ArticleDraft(String title, String description, String coverImage, Long categoryId,
                           Set<Long> tagIds, ArticleStatus status, JsonNode body, Instant scheduledAt) {
}
