package com.brandonkamga.lescracks.content.application;

import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.content.domain.model.ArticleBody;
import com.brandonkamga.lescracks.content.domain.model.ArticleSearch;
import com.brandonkamga.lescracks.content.domain.port.ArticleStore;
import com.brandonkamga.lescracks.engagement.application.EngagementCounts;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.newsletter.application.Announcements;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;
import com.brandonkamga.lescracks.shared.util.Slugs;
import com.brandonkamga.lescracks.storage.domain.CoverImages;
import com.brandonkamga.lescracks.storage.domain.StorageService;
import com.brandonkamga.lescracks.storage.domain.Upload;
import com.brandonkamga.lescracks.taxonomy.application.TaxonomyService;
import com.brandonkamga.lescracks.taxonomy.domain.model.Tag;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.HashSet;
import java.util.stream.Collectors;

public class ArticleAdminServiceImpl implements ArticleAdminService {
    private final ArticleStore articles;
    private final ArticleViews views;
    private final TaxonomyService taxonomy;
    private final StorageService storage;
    private final Announcements announcements;
    private final EngagementCounts engagement;
    private final ArticleBody articleBody;
    private final ObjectMapper json;

    public ArticleAdminServiceImpl(ArticleStore articles, ArticleViews views, TaxonomyService taxonomy, StorageService storage,
                                   Announcements announcements, EngagementCounts engagement, ArticleBody articleBody, ObjectMapper json) {
        this.articles = articles;
        this.views = views;
        this.taxonomy = taxonomy;
        this.storage = storage;
        this.announcements = announcements;
        this.engagement = engagement;
        this.articleBody = articleBody;
        this.json = json;
    }

    @Override
    public Paged<ArticleView> list(ArticleSearch search, PageQuery page) {
        String text = search.text() == null || search.text().isBlank() ? null : search.text().trim();
        Paged<Article> found = articles.search(new ArticleSearch(search.status(), text, search.categoryId(), search.tagId(), search.order()), page, true);
        return new Paged<>(views.of(found.items()), found.page(), found.size(), found.total());
    }

    @Override
    public ArticleView create(ArticleDraft draft, Upload cover) {
        Article article = Article.builder().build();
        apply(article, draft, CoverImages.resolve(storage, cover, draft.coverImage(), null));
        Article saved = articles.save(article);
        if (saved.isPublished()) announce(saved);
        return views.of(saved);
    }

    @Override
    public ArticleView update(Long id, ArticleDraft draft, Upload cover) {
        Article article = require(id);
        apply(article, draft, CoverImages.resolve(storage, cover, draft.coverImage(), article.getCoverImage()));
        article.setUpdatedAt(Instant.now());
        return views.of(articles.save(article));
    }

    @Override
    public void delete(Long id) {
        Article article = require(id);
        CoverImages.discard(storage, article.getCoverImage());
        articles.delete(id);
        engagement.forget(Target.article(id));
    }

    private void announce(Article article) {
        announcements.announceArticle(ArticleSchedule.newsOf(article));
    }

    private void apply(Article article, ArticleDraft draft, String coverImage) {
        article.setTitle(draft.title().trim());
        article.setDescription(draft.description().trim());
        article.setCoverImage(coverImage);
        article.setCategoryId(taxonomy.requireCategory(draft.categoryId()).getId());
        article.plan(draft.status(), draft.scheduledAt());
        if (article.getSlug() == null || article.getSlug().isBlank()) {
            article.setSlug(Slugs.uniqueFrom(article.getTitle(), articles::slugTaken));
        }
        if (draft.tagIds() != null) {
            article.setTagIds(taxonomy.requireTags(draft.tagIds()).stream().map(Tag::getId).collect(Collectors.toCollection(HashSet::new)));
        }
        article.setBody(draft.body());
        article.setPlainText(articleBody.toPlainText(toJson(draft)));
        article.setReadingMinutes(articleBody.readingMinutes(article.getPlainText()));
    }

    private String toJson(ArticleDraft draft) {
        try {
            return json.writeValueAsString(draft.body());
        } catch (JsonProcessingException malformed) {
            throw new BadRequestException("Le corps de l'article n'est pas un JSON valide.");
        }
    }

    private Article require(Long id) {
        return articles.findById(id).orElseThrow(() -> new NotFoundException("Resource", "id", id));
    }
}
