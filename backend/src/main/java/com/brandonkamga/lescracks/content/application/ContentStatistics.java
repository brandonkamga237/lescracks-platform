package com.brandonkamga.lescracks.content.application;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/** The figures the dashboard reads about articles and talks, each computed by one SQL query. */
public interface ContentStatistics {

    /** What the dashboard shows of an article it ranks. */
    record ArticleCard(Long id, String slug, String title, String coverImage, Long categoryId) {
    }

    Map<String, Long> articlesByStatus();

    /** Keyed by category id. */
    Map<Long, Long> articlesByCategory();

    /** Titles of several articles at once; unknown ids are absent. */
    Map<Long, String> articleTitles(Collection<Long> ids);

    /** Unknown slugs are absent. */
    List<ArticleCard> articlesBySlug(Collection<String> slugs);

    List<String> publishedSlugsBefore(Instant before);

    long countDraftsUntouchedSince(Instant before);

    long countTalks();

    long countPublishedTalks();
}
