package com.brandonkamga.lescracks.content.application;

import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.engagement.application.EngagementCounts;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.taxonomy.application.TaxonomyService;
import com.brandonkamga.lescracks.taxonomy.domain.model.Category;
import com.brandonkamga.lescracks.taxonomy.domain.model.Tag;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** Turns articles into views with three more queries, however many articles there are. */
public class ArticleViews {
    private final TaxonomyService taxonomy;
    private final EngagementCounts engagement;

    public ArticleViews(TaxonomyService taxonomy, EngagementCounts engagement) {
        this.taxonomy = taxonomy;
        this.engagement = engagement;
    }

    public List<ArticleView> of(Collection<Article> articles) {
        if (articles.isEmpty()) return List.of();
        Map<Long, Category> categories = taxonomy.findCategories(articles.stream().map(Article::getCategoryId).collect(Collectors.toSet()));
        Map<Long, Tag> tags = taxonomy.findTags(articles.stream().flatMap(article -> article.getTagIds().stream()).collect(Collectors.toSet()));
        Map<Long, Counts> counts = engagement.countsOf(TargetType.ARTICLE, articles.stream().map(Article::getId).toList());
        return articles.stream().map(article -> new ArticleView(article, categories.get(article.getCategoryId()),
                article.getTagIds().stream().map(tags::get).filter(tag -> tag != null).map(Tag::getName).sorted().toList(),
                counts.getOrDefault(article.getId(), Counts.NONE))).toList();
    }

    public ArticleView of(Article article) {
        return of(Set.of(article)).get(0);
    }
}
