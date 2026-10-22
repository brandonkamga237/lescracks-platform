package com.brandonkamga.lescracks.content.infra.persistence;

import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.content.domain.model.ArticleSearch;
import com.brandonkamga.lescracks.content.domain.model.ArticleStatus;
import com.brandonkamga.lescracks.content.domain.port.ArticleStore;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.enumOf;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;

/** An article is two reads, the rows then their tags, for one article or a whole page. */
@Component
class JdbcArticleStore implements ArticleStore {

    private static final String CARD = """
            id, slug, category_id, title, description, cover_image, status, scheduled_at, published_at,
            reading_minutes, created_at, updated_at""";
    private static final String FULL = CARD + ", body::text AS body, plain_text";

    private final JdbcClient jdbc;
    private final ObjectMapper json;

    JdbcArticleStore(JdbcClient jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    private RowMapper<Article> rows(boolean withBody) {
        return (row, number) -> Article.builder()
                .id(row.getLong("id"))
                .slug(row.getString("slug"))
                .categoryId(row.getLong("category_id"))
                .title(row.getString("title"))
                .description(row.getString("description"))
                .coverImage(row.getString("cover_image"))
                .status(enumOf(row, "status", ArticleStatus.class))
                .scheduledAt(instant(row, "scheduled_at"))
                .publishedAt(instant(row, "published_at"))
                .readingMinutes(row.getInt("reading_minutes"))
                .createdAt(instant(row, "created_at"))
                .updatedAt(instant(row, "updated_at"))
                .body(withBody ? read(row.getString("body")) : null)
                .plainText(withBody ? row.getString("plain_text") : null)
                .tagIds(new HashSet<>())
                .build();
    }

    @Override
    public Optional<Article> findById(Long id) {
        return withTags(jdbc.sql("SELECT " + FULL + " FROM articles WHERE id = :id").param("id", id).query(rows(true)).list())
                .stream().findFirst();
    }

    @Override
    public Optional<Article> findBySlug(String slug) {
        return withTags(jdbc.sql("SELECT " + FULL + " FROM articles WHERE slug = :slug").param("slug", slug).query(rows(true)).list())
                .stream().findFirst();
    }

    @Override
    public boolean slugTaken(String slug) {
        return jdbc.sql("SELECT EXISTS (SELECT 1 FROM articles WHERE slug = :slug)").param("slug", slug).query(Boolean.class).single();
    }

    @Override
    public Paged<Article> search(ArticleSearch search, PageQuery page, boolean withBody) {
        List<String> clauses = new ArrayList<>();
        Map<String, Object> params = new HashMap<>();
        if (search.status() != null) {
            clauses.add("status = :status");
            params.put("status", search.status().name());
        }
        if (search.text() != null) {
            clauses.add("lower(title) LIKE :like");
            params.put("like", "%" + search.text().toLowerCase() + "%");
        }
        if (search.categoryId() != null) {
            clauses.add("category_id = :category");
            params.put("category", search.categoryId());
        }
        if (search.tagId() != null) {
            clauses.add("EXISTS (SELECT 1 FROM article_tags t WHERE t.article_id = articles.id AND t.tag_id = :tag)");
            params.put("tag", search.tagId());
        }
        String where = clauses.isEmpty() ? "" : " WHERE " + String.join(" AND ", clauses);
        params.put("limit", page.size());
        params.put("offset", (long) page.page() * page.size());
        List<Long> totals = new ArrayList<>();
        RowMapper<Article> mapper = rows(withBody);
        List<Article> found = jdbc.sql("SELECT " + (withBody ? FULL : CARD) + ", count(*) OVER () AS total FROM articles" + where
                        + " ORDER BY coalesce(published_at, created_at) DESC, id DESC LIMIT :limit OFFSET :offset")
                .params(params)
                .query((row, number) -> {
                    if (number == 0) totals.add(row.getLong("total"));
                    return mapper.mapRow(row, number);
                }).list();
        long total = !totals.isEmpty() ? totals.get(0) : page.page() == 0 ? 0
                : jdbc.sql("SELECT count(*) FROM articles" + where).params(params).query(Long.class).single();
        return new Paged<>(withTags(found), page.page(), page.size(), total);
    }

    @Override
    public List<Article> findAllById(Collection<Long> ids) {
        if (ids.isEmpty()) return List.of();
        return jdbc.sql("SELECT " + CARD + " FROM articles WHERE id IN (:ids)").param("ids", ids).query(rows(false)).list();
    }

    @Override
    public List<Long> findScheduledIds(Instant now) {
        return jdbc.sql("SELECT id FROM articles WHERE status = 'DRAFT' AND scheduled_at <= :now ORDER BY scheduled_at")
                .param("now", at(now)).query(Long.class).list();
    }

    @Override
    public Map<Long, Long> countPublishedByCategory() {
        Map<Long, Long> counts = new LinkedHashMap<>();
        jdbc.sql("SELECT category_id, count(*) AS n FROM articles WHERE status = 'PUBLISHED' GROUP BY category_id")
                .query(row -> { counts.put(row.getLong("category_id"), row.getLong("n")); });
        return counts;
    }

    @Override
    public Article save(Article article) {
        Map<String, Object> params = new HashMap<>();
        params.put("slug", article.getSlug());
        params.put("category", article.getCategoryId());
        params.put("title", article.getTitle());
        params.put("description", article.getDescription());
        params.put("cover", article.getCoverImage());
        params.put("status", article.getStatus().name());
        params.put("scheduledAt", at(article.getScheduledAt()));
        params.put("publishedAt", at(article.getPublishedAt()));
        params.put("body", write(article));
        params.put("plainText", article.getPlainText());
        params.put("readingMinutes", article.getReadingMinutes());
        params.put("updatedAt", at(article.getUpdatedAt()));
        Long id = article.getId();
        if (id == null) {
            params.put("createdAt", at(article.getCreatedAt()));
            id = jdbc.sql("""
                    INSERT INTO articles (slug, category_id, title, description, cover_image, status, scheduled_at, published_at,
                                          body, plain_text, reading_minutes, created_at, updated_at)
                    VALUES (:slug, :category, :title, :description, :cover, :status, :scheduledAt, :publishedAt,
                            CAST(:body AS jsonb), :plainText, :readingMinutes, :createdAt, :updatedAt)
                    RETURNING id""").params(params).query(Long.class).single();
        } else {
            params.put("id", id);
            // A save without a body (a scheduled publication) keeps the stored one.
            jdbc.sql("""
                    UPDATE articles SET slug = :slug, category_id = :category, title = :title, description = :description,
                           cover_image = :cover, status = :status, scheduled_at = :scheduledAt, published_at = :publishedAt,
                           body = coalesce(CAST(:body AS jsonb), body), plain_text = coalesce(:plainText, plain_text),
                           reading_minutes = :readingMinutes, updated_at = :updatedAt
                    WHERE id = :id""").params(params).update();
        }
        saveTags(id, article.getTagIds() == null ? Set.of() : article.getTagIds());
        return article.toBuilder().id(id).build();
    }

    /** Two statements whatever the number of tags: drop what left, add what came. */
    private void saveTags(Long articleId, Set<Long> tagIds) {
        Long[] ids = tagIds.toArray(Long[]::new);
        jdbc.sql("DELETE FROM article_tags WHERE article_id = :article AND NOT (tag_id = ANY(:ids))")
                .param("article", articleId).param("ids", ids).update();
        if (ids.length == 0) return;
        jdbc.sql("INSERT INTO article_tags (article_id, tag_id) SELECT :article, unnest(:ids) ON CONFLICT DO NOTHING")
                .param("article", articleId).param("ids", ids).update();
    }

    @Override
    public void delete(Long id) {
        jdbc.sql("DELETE FROM articles WHERE id = :id").param("id", id).update();
    }

    private List<Article> withTags(List<Article> articles) {
        if (articles.isEmpty()) return articles;
        Map<Long, Article> byId = new HashMap<>();
        articles.forEach(article -> byId.put(article.getId(), article));
        jdbc.sql("SELECT article_id, tag_id FROM article_tags WHERE article_id IN (:ids)").param("ids", byId.keySet())
                .query(row -> { byId.get(row.getLong("article_id")).getTagIds().add(row.getLong("tag_id")); });
        return articles;
    }

    private com.fasterxml.jackson.databind.JsonNode read(String raw) {
        try {
            return raw == null ? null : json.readTree(raw);
        } catch (JsonProcessingException unreadable) {
            throw new IllegalStateException("Unreadable article body", unreadable);
        }
    }

    private String write(Article article) {
        try {
            return article.getBody() == null ? null : json.writeValueAsString(article.getBody());
        } catch (JsonProcessingException unwritable) {
            throw new IllegalStateException("Unwritable article body", unwritable);
        }
    }
}
