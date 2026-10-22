package com.brandonkamga.lescracks.content.application;

import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.content.domain.port.ArticleStore;
import com.brandonkamga.lescracks.newsletter.application.Announcements;
import com.brandonkamga.lescracks.newsletter.application.ArticleNews;
import com.brandonkamga.lescracks.shared.scheduling.ScheduledPublishing;

import java.time.Instant;
import java.util.List;

/** Articles drafted ahead, published by the scheduler when their date comes. */
public class ArticleSchedule implements ScheduledPublishing {
    private final ArticleStore articles;
    private final Announcements announcements;

    public ArticleSchedule(ArticleStore articles, Announcements announcements) {
        this.articles = articles;
        this.announcements = announcements;
    }

    @Override
    public List<Long> dueForPublication(Instant now) {
        return articles.findScheduledIds(now);
    }

    @Override
    public boolean publishScheduled(Long id, Instant now) {
        Article article = articles.findById(id).orElse(null);
        if (article == null || !article.publishOnSchedule(now)) return false;
        articles.save(article);
        return true;
    }

    @Override
    public void announce(Long id) {
        articles.findById(id).ifPresent(article -> announcements.announceArticle(newsOf(article)));
    }

    static ArticleNews newsOf(Article article) {
        return new ArticleNews(article.getTitle(), article.getDescription(), article.path(), article.getCoverImage());
    }
}
