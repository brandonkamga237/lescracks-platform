package com.brandonkamga.lescracks.content.infra.persistence;

import com.brandonkamga.lescracks.content.application.ContentStatistics;
import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.content.domain.model.ArticleSearch;
import com.brandonkamga.lescracks.content.domain.model.ArticleStatus;
import com.brandonkamga.lescracks.content.domain.model.Talk;
import com.brandonkamga.lescracks.content.domain.model.TalkStatus;
import com.brandonkamga.lescracks.content.domain.port.ArticleStore;
import com.brandonkamga.lescracks.content.domain.port.TalkStore;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.support.PostgresIT;
import com.brandonkamga.lescracks.taxonomy.domain.model.Category;
import com.brandonkamga.lescracks.taxonomy.domain.model.Tag;
import com.brandonkamga.lescracks.taxonomy.domain.port.CategoryStore;
import com.brandonkamga.lescracks.taxonomy.domain.port.TagStore;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/** Every statement of content's adapters, and taxonomy's, against PostgreSQL. */
@Transactional
class JdbcContentIT extends PostgresIT {

    @Autowired private ArticleStore articles;
    @Autowired private TalkStore talks;
    @Autowired private ContentStatistics statistics;
    @Autowired private CategoryStore categories;
    @Autowired private TagStore tags;
    @Autowired private ObjectMapper json;

    private Category backend;
    private Category mobile;
    private Tag java;
    private Tag kotlin;

    @BeforeEach
    void setUp() {
        backend = categories.save(Category.builder().name("IT Backend").slug("it-backend").build());
        mobile = categories.save(Category.builder().name("IT Mobile").slug("it-mobile").build());
        java = tags.save(Tag.builder().name("IT Java").build());
        kotlin = tags.save(Tag.builder().name("IT Kotlin").build());
    }

    private Article article(String slug, Category theme, ArticleStatus status, Instant publishedAt, Set<Long> tagIds) {
        return articles.save(Article.builder().slug(slug).title("Titre " + slug).description("Description").coverImage("https://cdn/x.png")
                .categoryId(theme.getId()).status(status).publishedAt(publishedAt).tagIds(new HashSet<>(tagIds))
                .body(json.createObjectNode().put("html", "<p>" + slug + "</p>")).plainText(slug).readingMinutes(2).build());
    }

    @Test
    @DisplayName("an article round-trips with its body and tags; a save without a body keeps the stored one")
    void roundTrip() {
        Article saved = article("it-round-trip", backend, ArticleStatus.DRAFT, null, Set.of(java.getId(), kotlin.getId()));

        Article loaded = articles.findBySlug("it-round-trip").orElseThrow();
        assertThat(loaded.getTagIds()).containsExactlyInAnyOrder(java.getId(), kotlin.getId());
        assertThat(loaded.getBody().get("html").asText()).isEqualTo("<p>it-round-trip</p>");
        assertThat(loaded.getReadingMinutes()).isEqualTo(2);
        assertThat(articles.slugTaken("it-round-trip")).isTrue();

        Article card = articles.findAllById(List.of(saved.getId())).get(0);
        assertThat(card.getBody()).isNull();
        card.setStatus(ArticleStatus.PUBLISHED);
        card.setTagIds(new HashSet<>(Set.of(kotlin.getId())));
        articles.save(card);

        Article again = articles.findById(saved.getId()).orElseThrow();
        assertThat(again.getStatus()).isEqualTo(ArticleStatus.PUBLISHED);
        assertThat(again.getBody()).isNotNull();
        assertThat(again.getPlainText()).isEqualTo("it-round-trip");
        assertThat(again.getTagIds()).containsExactly(kotlin.getId());
    }

    @Test
    @DisplayName("search filters by status, title fragment, theme and tag, newest publication first, with the full total")
    void search() {
        Article old = article("it-old", backend, ArticleStatus.PUBLISHED, Instant.parse("2026-01-01T00:00:00Z"), Set.of(java.getId()));
        Article recent = article("it-recent", backend, ArticleStatus.PUBLISHED, Instant.parse("2026-06-01T00:00:00Z"), Set.of());
        article("it-draft", mobile, ArticleStatus.DRAFT, null, Set.of(java.getId()));

        var published = articles.search(ArticleSearch.published(null, backend.getId(), null), new PageQuery(0, 1), false);
        assertThat(published.items()).extracting(Article::getId).containsExactly(recent.getId());
        assertThat(published.total()).isEqualTo(2);
        assertThat(published.items().get(0).getBody()).isNull();

        assertThat(articles.search(ArticleSearch.backOffice(null, "TITRE IT-D", null, null), new PageQuery(0, 10), false).items())
                .extracting(Article::getSlug).containsExactly("it-draft");
        assertThat(articles.search(ArticleSearch.backOffice(ArticleStatus.PUBLISHED, null, null, java.getId()), new PageQuery(0, 10), true).items())
                .extracting(Article::getId).containsExactly(old.getId());
        assertThat(articles.search(ArticleSearch.backOffice(null, null, mobile.getId(), null), new PageQuery(3, 10), false).total()).isEqualTo(1);

        // Written last but dated earlier: readers see it after the others, the back office first.
        Article backdated = article("it-backdated", backend, ArticleStatus.PUBLISHED, Instant.parse("2025-01-01T00:00:00Z"), Set.of());
        assertThat(articles.search(ArticleSearch.published(null, backend.getId(), null), new PageQuery(0, 10), false).items())
                .extracting(Article::getId).containsExactly(recent.getId(), old.getId(), backdated.getId());
        assertThat(articles.search(ArticleSearch.backOffice(ArticleStatus.PUBLISHED, null, backend.getId(), null), new PageQuery(0, 10), false).items())
                .extracting(Article::getId).containsExactly(backdated.getId(), recent.getId(), old.getId());
    }

    @Test
    @DisplayName("a draft is due once its date has come; a theme counts its published articles only")
    void scheduleAndThemes() {
        Instant now = Instant.now();
        Article due = articles.save(article("it-due", mobile, ArticleStatus.DRAFT, null, Set.of()).toBuilder()
                .scheduledAt(now.minus(1, ChronoUnit.MINUTES)).build());
        articles.save(article("it-later", mobile, ArticleStatus.DRAFT, null, Set.of()).toBuilder()
                .scheduledAt(now.plus(1, ChronoUnit.DAYS)).build());
        article("it-live", mobile, ArticleStatus.PUBLISHED, now, Set.of());

        assertThat(articles.findScheduledIds(now)).contains(due.getId()).hasSize(1);
        assertThat(articles.countPublishedByCategory()).containsEntry(mobile.getId(), 1L).doesNotContainKey(backend.getId());
    }

    @Test
    @DisplayName("deleting an article takes its tags with it, and a theme in use refuses to go")
    void deletes() {
        Article doomed = article("it-doomed", backend, ArticleStatus.DRAFT, null, Set.of(java.getId()));

        articles.delete(doomed.getId());

        assertThat(articles.findById(doomed.getId())).isEmpty();
        assertThat(tags.findByName("it java")).isPresent();
        article("it-keeper", backend, ArticleStatus.DRAFT, null, Set.of());
        // Last statement: the refused DELETE aborts the surrounding test transaction.
        assertThat(categories.delete(backend.getId())).isFalse();
    }

    @Test
    @DisplayName("the dashboard figures are grouped counts, and a draft untouched for long is noticed")
    void statistics() {
        Instant now = Instant.now();
        article("it-stat-1", backend, ArticleStatus.PUBLISHED, now, Set.of());
        Article stale = article("it-stat-2", mobile, ArticleStatus.DRAFT, null, Set.of());
        articles.save(stale.toBuilder().createdAt(now.minus(30, ChronoUnit.DAYS)).updatedAt(now.minus(20, ChronoUnit.DAYS)).build());

        assertThat(statistics.articlesByCategory()).containsEntry(backend.getId(), 1L).containsEntry(mobile.getId(), 1L);
        assertThat(statistics.articlesByStatus()).containsKeys("PUBLISHED", "DRAFT");
        assertThat(statistics.articleTitles(List.of(stale.getId()))).containsEntry(stale.getId(), "Titre it-stat-2");
        assertThat(statistics.articlesBySlug(List.of("it-stat-1", "absent"))).extracting(ContentStatistics.ArticleCard::slug)
                .containsExactly("it-stat-1");
        assertThat(statistics.countDraftsUntouchedSince(now.minus(14, ChronoUnit.DAYS))).isGreaterThanOrEqualTo(1);
        assertThat(statistics.publishedSlugsBefore(now.plusSeconds(60))).contains("it-stat-1");
    }

    @Test
    @DisplayName("talks round-trip, list newest published first, and count by status")
    void talks() {
        long before = statistics.countPublishedTalks();
        Talk first = talks.save(Talk.builder().title("Un").description("D").youtubeUrl("https://youtu.be/1")
                .status(TalkStatus.PUBLISHED).publishedAt(Instant.parse("2026-01-01T00:00:00Z")).durationMinutes(30).build());
        Talk second = talks.save(Talk.builder().title("Deux").description("D").youtubeUrl("https://youtu.be/2")
                .status(TalkStatus.PUBLISHED).publishedAt(Instant.parse("2026-02-01T00:00:00Z")).build());
        Talk draft = talks.save(Talk.builder().title("Brouillon").description("D").youtubeUrl("https://youtu.be/3").build());

        assertThat(talks.findById(first.getId())).get().extracting(Talk::getDurationMinutes).isEqualTo(30);
        assertThat(talks.findAll(TalkStatus.PUBLISHED, new PageQuery(0, 50)).items()).extracting(Talk::getId)
                .containsSubsequence(second.getId(), first.getId()).doesNotContain(draft.getId());
        assertThat(statistics.countPublishedTalks()).isEqualTo(before + 2);

        talks.save(draft.toBuilder().title("Renommé").build());
        assertThat(talks.findById(draft.getId())).get().extracting(Talk::getTitle).isEqualTo("Renommé");
        talks.delete(draft.getId());
        assertThat(talks.findById(draft.getId())).isEmpty();
    }
}
