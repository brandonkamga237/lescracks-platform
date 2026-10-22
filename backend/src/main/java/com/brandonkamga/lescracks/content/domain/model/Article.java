package com.brandonkamga.lescracks.content.domain.model;

import com.brandonkamga.lescracks.shared.scheduling.Schedules;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/** A blog article: its card, its block body, its theme and tags, and when it goes public. */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class Article {

    private Long id;

    private String slug;

    private Long categoryId;

    private String title;

    private String description;

    private String coverImage;

    @Builder.Default
    private ArticleStatus status = ArticleStatus.DRAFT;

    /** Set on a draft that the scheduler will publish at that time. */
    private Instant scheduledAt;

    /** First time it went public; the catalogue's "newest first" follows it. */
    private Instant publishedAt;

    @Builder.Default
    private Set<Long> tagIds = new HashSet<>();

    /** Null when loaded for a card, which never needs tens of kilobytes of blocks. */
    private JsonNode body;

    private String plainText;

    @Builder.Default
    private int readingMinutes = 1;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();

    public boolean isPublished() {
        return status == ArticleStatus.PUBLISHED;
    }

    /** A scheduled date keeps the article a draft until the scheduler publishes it; no date cancels the schedule. */
    public void plan(ArticleStatus requested, Instant requestedSchedule) {
        scheduledAt = Schedules.check(requestedSchedule, scheduledAt);
        if (scheduledAt != null) {
            status = ArticleStatus.DRAFT;
        } else if (requested != null) {
            status = requested;
        }
        if (isPublished() && publishedAt == null) publishedAt = Instant.now();
    }

    /** False when the draft is no longer due: rescheduled, published by hand or deleted meanwhile. */
    public boolean publishOnSchedule(Instant now) {
        if (status != ArticleStatus.DRAFT || scheduledAt == null || scheduledAt.isAfter(now)) return false;
        status = ArticleStatus.PUBLISHED;
        scheduledAt = null;
        // Its publication day, not its drafting day, is what makes it "new" in the catalogue.
        publishedAt = now;
        updatedAt = now;
        return true;
    }

    public String path() {
        return "/blog/" + (slug == null || slug.isBlank() ? id : slug);
    }
}
