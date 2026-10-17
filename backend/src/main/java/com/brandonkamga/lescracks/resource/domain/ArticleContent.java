package com.brandonkamga.lescracks.resource.domain;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.Set;

/** What an admin writes for an article: its card, its body and when it goes public. */
public record ArticleContent(String title, String description, String coverImage, Long categoryId,
                             Set<Long> tagIds, ResourceStatus status, JsonNode body, Instant scheduledAt) {
}
