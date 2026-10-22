package com.brandonkamga.lescracks.content.application;

import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.content.domain.model.ArticleSearch;
import com.brandonkamga.lescracks.content.domain.port.ArticleStore;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;
import com.brandonkamga.lescracks.taxonomy.application.TaxonomyService;
import com.brandonkamga.lescracks.taxonomy.domain.model.Category;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class ArticleCatalogImpl implements ArticleCatalog {
    private static final int ALL = 10_000;

    private final ArticleStore articles;
    private final ArticleViews views;
    private final TaxonomyService taxonomy;

    public ArticleCatalogImpl(ArticleStore articles, ArticleViews views, TaxonomyService taxonomy) {
        this.articles = articles;
        this.views = views;
        this.taxonomy = taxonomy;
    }

    @Override
    public Paged<ArticleView> search(String text, Long categoryId, Long tagId, PageQuery page) {
        Paged<Article> found = articles.search(ArticleSearch.published(blankToNull(text), categoryId, tagId), page, false);
        return new Paged<>(views.of(found.items()), found.page(), found.size(), found.total());
    }

    @Override
    public ArticleView requirePublished(String slugOrId) {
        return find(slugOrId).filter(Article::isPublished).map(views::of)
                .orElseThrow(() -> new NotFoundException("Resource", "slug", slugOrId));
    }

    @Override
    public List<ThemeCount> listThemes() {
        Map<Long, Long> counts = articles.countPublishedByCategory();
        Map<Long, Category> themes = taxonomy.findCategories(counts.keySet());
        return counts.entrySet().stream().filter(entry -> themes.containsKey(entry.getKey()))
                .map(entry -> new ThemeCount(themes.get(entry.getKey()), entry.getValue()))
                .sorted(Comparator.comparingLong(ThemeCount::articles).reversed().thenComparing(count -> count.theme().getName()))
                .toList();
    }

    @Override
    public List<Article> listPublished() {
        return articles.search(ArticleSearch.published(null, null, null), new PageQuery(0, ALL), false).items();
    }

    private Optional<Article> find(String slugOrId) {
        if (slugOrId == null || slugOrId.isBlank()) return Optional.empty();
        return articles.findBySlug(slugOrId).or(() -> parseId(slugOrId).flatMap(articles::findById));
    }

    private static Optional<Long> parseId(String value) {
        try {
            return Optional.of(Long.parseLong(value));
        } catch (NumberFormatException notAnId) {
            return Optional.empty();
        }
    }

    private static String blankToNull(String text) {
        return text == null || text.isBlank() ? null : text.trim();
    }
}
