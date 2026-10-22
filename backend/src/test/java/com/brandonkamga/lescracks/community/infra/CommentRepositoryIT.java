package com.brandonkamga.lescracks.community.infra;

import com.brandonkamga.lescracks.community.domain.Comment;
import com.brandonkamga.lescracks.community.domain.CommentReport;
import com.brandonkamga.lescracks.community.domain.CommentStatus;
import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.resource.domain.Resource;
import com.brandonkamga.lescracks.resource.domain.ResourceStatus;
import com.brandonkamga.lescracks.resource.infra.ResourceRepository;
import com.brandonkamga.lescracks.support.PostgresIT;
import com.brandonkamga.lescracks.taxonomy.infra.CategoryRepository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import static com.brandonkamga.lescracks.resource.domain.ResourceFixtures.category;
import static com.brandonkamga.lescracks.resource.domain.ResourceFixtures.resource;
import static org.assertj.core.api.Assertions.assertThat;

/** The V32 tables and the moderation queue, against real PostgreSQL. */
@Transactional
class CommentRepositoryIT extends PostgresIT {

    @Autowired private CommentRepository comments;
    @Autowired private CommentReportRepository reports;
    @Autowired private ResourceRepository resources;
    @Autowired private CategoryRepository categories;
    @Autowired private AccountStore users;

    @Test
    @DisplayName("the queue lists reported comments by number of reports, never deleted ones, and keeps who reported what")
    void moderationQueue() {
        Resource article = resources.save(resource(categories.save(category("Comments")), "Commentaires", ResourceStatus.PUBLISHED));
        Account awa = users.save(Account.builder().email("awa.comments@example.com").firstName("Awa").lastName("D").passwordHash("h").build());
        Comment once = comments.save(Comment.builder().resourceId(article.getId()).authorId(awa.getId()).body("un").reportCount(1).build());
        Comment twice = comments.save(Comment.builder().resourceId(article.getId()).authorId(awa.getId()).body("deux").reportCount(2).build());
        comments.save(Comment.builder().resourceId(article.getId()).authorId(awa.getId()).body("supprimé").reportCount(5).status(CommentStatus.DELETED).build());
        comments.saveAndFlush(Comment.builder().resourceId(article.getId()).authorId(awa.getId()).parentId(once.getId()).body("réponse").build());

        assertThat(comments.findReported(PageRequest.of(0, 10)).getContent()).extracting(Comment::getId).containsExactly(twice.getId(), once.getId());
        assertThat(comments.findByResourceIdOrderByCreatedAtAsc(article.getId())).hasSize(4);

        reports.saveAndFlush(CommentReport.builder().commentId(once.getId()).reporterId(awa.getId()).reason("hors sujet").build());
        assertThat(reports.existsByCommentIdAndReporterId(once.getId(), awa.getId())).isTrue();
        assertThat(reports.findByCommentIdOrderByCreatedAtDesc(once.getId())).extracting(CommentReport::getReason).containsExactly("hors sujet");
    }
}
