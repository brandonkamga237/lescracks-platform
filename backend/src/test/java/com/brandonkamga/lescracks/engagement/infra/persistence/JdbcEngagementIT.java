package com.brandonkamga.lescracks.engagement.infra.persistence;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.engagement.domain.model.Comment;
import com.brandonkamga.lescracks.engagement.domain.model.CommentStatus;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.engagement.domain.port.CommentStore;
import com.brandonkamga.lescracks.engagement.domain.port.ReactionStore;
import com.brandonkamga.lescracks.engagement.domain.port.ReportStore;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.support.PostgresIT;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/** Every statement of engagement's adapters against PostgreSQL. */
@Transactional
class JdbcEngagementIT extends PostgresIT {

    private static final Target ARTICLE = new Target(TargetType.ARTICLE, 900_001L);

    @Autowired private ReactionStore reactions;
    @Autowired private CommentStore comments;
    @Autowired private ReportStore reports;
    @Autowired private AccountStore accounts;

    private Long awa;
    private Long kofi;

    @BeforeEach
    void setUp() {
        awa = accounts.save(Account.builder().email("awa.engagement@example.com").firstName("Awa").lastName("D").passwordHash("h").build()).getId();
        kofi = accounts.save(Account.builder().email("kofi.engagement@example.com").firstName("Kofi").lastName("A").passwordHash("h").build()).getId();
    }

    @Test
    @DisplayName("a view or a like counts once, with its counter in the same statement, and a list reads every counter at once")
    void reactions() {
        assertThat(reactions.addView(ARTICLE, "a:1")).isTrue();
        assertThat(reactions.addView(ARTICLE, "a:1")).isFalse();
        reactions.addView(ARTICLE, "a:2");
        assertThat(reactions.addLike(ARTICLE, awa)).isTrue();
        assertThat(reactions.addLike(ARTICLE, awa)).isFalse();
        reactions.addLike(ARTICLE, kofi);
        assertThat(reactions.removeLike(ARTICLE, kofi)).isTrue();
        assertThat(reactions.removeLike(ARTICLE, kofi)).isFalse();

        assertThat(reactions.counts(ARTICLE)).isEqualTo(new Counts(2, 1));
        assertThat(reactions.hasLiked(ARTICLE, awa)).isTrue();
        assertThat(reactions.counts(TargetType.ARTICLE, List.of(ARTICLE.id(), 404L))).containsOnlyKeys(ARTICLE.id());
        assertThat(reactions.mostLiked(TargetType.ARTICLE, 100)).containsEntry(ARTICLE.id(), new Counts(2, 1));

        reactions.forget(ARTICLE);
        assertThat(reactions.counts(ARTICLE)).isEqualTo(Counts.NONE);
    }

    @Test
    @DisplayName("comments go in and come back by target, oldest first, and are updated, counted and deleted")
    void comments() {
        Comment first = comments.save(Comment.builder().targetType(TargetType.ARTICLE).targetId(ARTICLE.id()).authorId(awa).body("Premier")
                .createdAt(Instant.now().minus(1, ChronoUnit.MINUTES).truncatedTo(ChronoUnit.MICROS)).build());
        Comment reply = comments.save(Comment.builder().targetType(TargetType.ARTICLE).targetId(ARTICLE.id()).authorId(kofi)
                .parentId(first.getId()).body("Réponse").createdAt(Instant.now().truncatedTo(ChronoUnit.MICROS)).build());

        assertThat(comments.findByTarget(ARTICLE)).extracting(Comment::getId).containsExactly(first.getId(), reply.getId());
        assertThat(comments.findById(reply.getId()).orElseThrow()).usingRecursiveComparison().isEqualTo(reply);
        assertThat(comments.countByAuthorSince(awa, Instant.now().minus(1, ChronoUnit.HOURS))).isEqualTo(1);

        first.reported();
        first.edit("Premier, modifié");
        comments.save(first);
        assertThat(comments.findById(first.getId()).orElseThrow().getReportCount()).isEqualTo(1);
        assertThat(comments.findForModeration(true, new PageQuery(0, 20)).items()).extracting(Comment::getId).contains(first.getId());

        comments.delete(reply.getId());
        comments.deleteByTarget(ARTICLE);
        assertThat(comments.findByTarget(ARTICLE)).isEmpty();
    }

    @Test
    @DisplayName("a report is kept once per member, and the reasons of a page of comments come back in one query")
    void reports() {
        Comment comment = comments.save(Comment.builder().targetType(TargetType.ARTICLE).targetId(ARTICLE.id()).authorId(awa)
                .body("Signalé").status(CommentStatus.VISIBLE).build());

        reports.add(comment.getId(), kofi, "insultant");

        assertThat(reports.exists(comment.getId(), kofi)).isTrue();
        assertThat(reports.exists(comment.getId(), awa)).isFalse();
        assertThat(reports.reasonsOf(Set.of(comment.getId()))).containsEntry(comment.getId(), List.of("insultant"));
    }
}
