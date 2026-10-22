package com.brandonkamga.lescracks.content.application;

import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.content.domain.model.ArticleStatus;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class ArticleScheduleTest {

    private final InMemoryContent.Articles articles = new InMemoryContent.Articles();
    private final InMemoryContent.Newsletter newsletter = new InMemoryContent.Newsletter();
    private final ArticleSchedule schedule = new ArticleSchedule(articles, newsletter);
    private final Instant now = Instant.now();

    private Article draft(String title, Instant scheduledAt) {
        return articles.save(Article.builder().title(title).description("D").slug(title.toLowerCase()).categoryId(1L)
                .scheduledAt(scheduledAt).build());
    }

    @Test
    @DisplayName("once due, the scheduler publishes it, dates it from that moment, and the subscribers hear of it")
    void publishesWhenDue() {
        Article due = draft("Due", now.minusSeconds(30));

        assertThat(schedule.dueForPublication(now)).containsExactly(due.getId());
        assertThat(schedule.publishScheduled(due.getId(), now)).isTrue();
        schedule.announce(due.getId());

        Article stored = articles.stored(due.getId());
        assertThat(stored.getStatus()).isEqualTo(ArticleStatus.PUBLISHED);
        assertThat(stored.getScheduledAt()).isNull();
        assertThat(stored.getPublishedAt()).isEqualTo(now);
        assertThat(newsletter.articles).extracting(news -> news.path()).containsExactly("/blog/due");
    }

    @Test
    @DisplayName("a draft rescheduled later, or already published by hand, is left alone")
    void skipsWhatIsNoLongerDue() {
        Article later = draft("Later", now.plusSeconds(3600));
        Article live = articles.save(Article.builder().title("Live").categoryId(1L).status(ArticleStatus.PUBLISHED).build());

        assertThat(schedule.dueForPublication(now)).isEmpty();
        assertThat(schedule.publishScheduled(later.getId(), now)).isFalse();
        assertThat(schedule.publishScheduled(live.getId(), now)).isFalse();
        assertThat(schedule.publishScheduled(404L, now)).isFalse();
        assertThat(articles.stored(later.getId()).getStatus()).isEqualTo(ArticleStatus.DRAFT);
    }
}
