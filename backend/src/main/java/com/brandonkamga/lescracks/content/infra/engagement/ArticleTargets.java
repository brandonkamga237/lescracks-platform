package com.brandonkamga.lescracks.content.infra.engagement;

import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.content.domain.port.ArticleStore;
import com.brandonkamga.lescracks.engagement.application.ContentTargets;
import com.brandonkamga.lescracks.engagement.application.TargetPage;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;

import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

/** Articles as engagement targets. Store only: the article services read engagement's counts. */
@Component
class ArticleTargets implements ContentTargets {

    private final ArticleStore articles;

    ArticleTargets(ArticleStore articles) {
        this.articles = articles;
    }

    @Override
    public TargetType type() {
        return TargetType.ARTICLE;
    }

    @Override
    public boolean isOpen(Long id) {
        return articles.findAllById(java.util.List.of(id)).stream().anyMatch(Article::isPublished);
    }

    @Override
    public Map<Long, TargetPage> describe(Collection<Long> ids) {
        return articles.findAllById(ids).stream()
                .collect(Collectors.toMap(Article::getId, article -> new TargetPage(article.getId(), article.getTitle(), article.path())));
    }
}
