package com.brandonkamga.lescracks.content.infra.persistence;

import com.brandonkamga.lescracks.content.application.ContentStatistics;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;

@Component
class JdbcContentStatistics implements ContentStatistics {

    private final JdbcClient jdbc;

    JdbcContentStatistics(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Map<String, Long> articlesByStatus() {
        Map<String, Long> counts = new LinkedHashMap<>();
        jdbc.sql("SELECT status, count(*) AS n FROM articles GROUP BY status ORDER BY n DESC")
                .query(row -> { counts.put(row.getString("status"), row.getLong("n")); });
        return counts;
    }

    @Override
    public Map<Long, Long> articlesByCategory() {
        Map<Long, Long> counts = new LinkedHashMap<>();
        jdbc.sql("SELECT category_id, count(*) AS n FROM articles GROUP BY category_id ORDER BY n DESC")
                .query(row -> { counts.put(row.getLong("category_id"), row.getLong("n")); });
        return counts;
    }

    @Override
    public Map<Long, String> articleTitles(Collection<Long> ids) {
        Map<Long, String> titles = new HashMap<>();
        if (ids.isEmpty()) return titles;
        jdbc.sql("SELECT id, title FROM articles WHERE id IN (:ids)").param("ids", ids)
                .query(row -> { titles.put(row.getLong("id"), row.getString("title")); });
        return titles;
    }

    @Override
    public List<ArticleCard> articlesBySlug(Collection<String> slugs) {
        if (slugs.isEmpty()) return List.of();
        return jdbc.sql("SELECT id, slug, title, cover_image, category_id FROM articles WHERE slug IN (:slugs)")
                .param("slugs", slugs)
                .query((row, number) -> new ArticleCard(row.getLong("id"), row.getString("slug"), row.getString("title"),
                        row.getString("cover_image"), row.getLong("category_id")))
                .list();
    }

    @Override
    public List<String> publishedSlugsBefore(Instant before) {
        return jdbc.sql("SELECT slug FROM articles WHERE status = 'PUBLISHED' AND created_at < :before")
                .param("before", at(before)).query(String.class).list();
    }

    @Override
    public long countDraftsUntouchedSince(Instant before) {
        return jdbc.sql("SELECT count(*) FROM articles WHERE status = 'DRAFT' AND updated_at < :before")
                .param("before", at(before)).query(Long.class).single();
    }

    @Override
    public long countTalks() {
        return jdbc.sql("SELECT count(*) FROM talk_videos").query(Long.class).single();
    }

    @Override
    public long countPublishedTalks() {
        return jdbc.sql("SELECT count(*) FROM talk_videos WHERE status = 'PUBLISHED'").query(Long.class).single();
    }
}
