package com.brandonkamga.lescracks.content.application;

import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.content.domain.model.ArticleStatus;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.support.InMemoryTaxonomy;
import com.brandonkamga.lescracks.taxonomy.domain.model.Category;
import com.brandonkamga.lescracks.taxonomy.domain.model.Tag;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ArticleCatalogTest {

    private final InMemoryContent.Articles articles = new InMemoryContent.Articles();
    private final InMemoryContent.Engagement engagement = new InMemoryContent.Engagement();
    private final InMemoryTaxonomy taxonomy = new InMemoryTaxonomy();
    private final ArticleCatalog catalog = new ArticleCatalogImpl(articles, new ArticleViews(taxonomy.service, engagement), taxonomy.service);

    private Category backend;
    private Category mobile;
    private Tag java;

    @BeforeEach
    void setUp() {
        backend = taxonomy.theme("Backend");
        mobile = taxonomy.theme("Mobile");
        java = taxonomy.tag("Java");
    }

    private Article article(String slug, Category theme, ArticleStatus status, Instant publishedAt) {
        return articles.save(Article.builder().slug(slug).title(slug).description("D").categoryId(theme.getId())
                .status(status).publishedAt(publishedAt).tagIds(Set.of(java.getId())).build());
    }

    @Test
    @DisplayName("a draft is invisible to the public routes, even by id")
    void hidesDrafts() {
        Article draft = article("brouillon", backend, ArticleStatus.DRAFT, null);

        assertThatThrownBy(() -> catalog.requirePublished("brouillon")).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> catalog.requirePublished(String.valueOf(draft.getId()))).isInstanceOf(NotFoundException.class);
        assertThat(catalog.search(null, null, null, new PageQuery(0, 10)).items()).isEmpty();
    }

    @Test
    @DisplayName("an old numeric url still resolves once the article has a slug, and an unknown slug is a 404")
    void fallsBackFromSlugToId() {
        Article published = article("spring-boot", backend, ArticleStatus.PUBLISHED, Instant.now());

        assertThat(catalog.requirePublished(String.valueOf(published.getId())).article().getSlug()).isEqualTo("spring-boot");
        assertThatThrownBy(() -> catalog.requirePublished("inconnu")).isInstanceOf(NotFoundException.class).hasMessageContaining("inconnu");
    }

    @Test
    @DisplayName("cards carry their theme, tag names and audience, newest publication first, without a body")
    void listsCards() {
        Article older = article("ancien", backend, ArticleStatus.PUBLISHED, Instant.parse("2026-01-01T00:00:00Z"));
        Article newer = article("nouveau", mobile, ArticleStatus.PUBLISHED, Instant.parse("2026-06-01T00:00:00Z"));
        engagement.counts.put(Target.article(older.getId()), new Counts(40, 3));

        var page = catalog.search(null, null, null, new PageQuery(0, 10));

        assertThat(page.items()).extracting(view -> view.article().getId()).containsExactly(newer.getId(), older.getId());
        ArticleView card = page.items().get(1);
        assertThat(card.category().getName()).isEqualTo("Backend");
        assertThat(card.tags()).containsExactly("Java");
        assertThat(card.counts()).isEqualTo(new Counts(40, 3));
        assertThat(card.article().getBody()).isNull();
    }

    @Test
    @DisplayName("themes list only those with published articles, fullest first, and skip a theme deleted since")
    void listsThemes() {
        article("a", backend, ArticleStatus.PUBLISHED, Instant.now());
        article("b", backend, ArticleStatus.PUBLISHED, Instant.now());
        article("c", mobile, ArticleStatus.PUBLISHED, Instant.now());
        article("d", mobile, ArticleStatus.DRAFT, null);
        Category gone = taxonomy.theme("Supprimé");
        article("e", gone, ArticleStatus.PUBLISHED, Instant.now());
        taxonomy.categories.delete(gone.getId());

        assertThat(catalog.listThemes()).extracting(theme -> theme.theme().getName() + "=" + theme.articles())
                .containsExactly("Backend=2", "Mobile=1");
    }
}
