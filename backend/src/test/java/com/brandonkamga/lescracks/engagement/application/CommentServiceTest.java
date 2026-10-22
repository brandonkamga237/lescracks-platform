package com.brandonkamga.lescracks.engagement.application;

import com.brandonkamga.lescracks.engagement.domain.model.Comment;
import com.brandonkamga.lescracks.engagement.domain.model.CommentStatus;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.mail.domain.CommentReplyEmail;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;
import com.brandonkamga.lescracks.shared.exception.ForbiddenException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.paging.PageQuery;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CommentServiceTest {

    private static final Target ARTICLE = Target.article(7L);

    private final InMemoryEngagement.Comments comments = new InMemoryEngagement.Comments();
    private final InMemoryEngagement.Reports reports = new InMemoryEngagement.Reports();
    private final MemberDirectory people = mock(MemberDirectory.class);
    private final Mailer mailer = mock(Mailer.class);
    private final Member awa = Member.builder().id(1L).email("awa@example.com").firstName("Awa").lastName("Diallo").active(true).build();
    private final Member eric = Member.builder().id(2L).email("eric@example.com").firstName("Eric").lastName("Tchana").active(true).build();

    private CommentServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new CommentServiceImpl(comments, reports, InMemoryEngagement.articles(), people, mailer);
        when(people.require("awa@example.com")).thenReturn(awa);
        when(people.require("eric@example.com")).thenReturn(eric);
        when(people.findAll(anyCollection())).thenReturn(Map.of(1L, awa, 2L, eric));
    }

    private Comment comment(Member author, Long parentId) {
        return comments.save(Comment.builder().targetType(ARTICLE.type()).targetId(ARTICLE.id())
                .authorId(author.getId()).parentId(parentId).body("Merci !").build());
    }

    @Test
    @DisplayName("answering a reply joins its thread, and the author of the thread's comment is emailed")
    void replyJoinsTheThreadAndNotifies() {
        Comment root = comment(awa, null);
        Comment reply = comment(awa, root.getId());

        CommentView answer = service.post("eric@example.com", ARTICLE, new CommentDraft("  Bien vu, merci  ", reply.getId()));

        assertThat(comments.stored(answer.comment().getId()).getParentId()).isEqualTo(root.getId());
        assertThat(comments.stored(answer.comment().getId()).getBody()).isEqualTo("Bien vu, merci");
        ArgumentCaptor<CommentReplyEmail> email = ArgumentCaptor.forClass(CommentReplyEmail.class);
        verify(mailer).send(email.capture());
        assertThat(email.getValue().to()).isEqualTo("awa@example.com");
        assertThat(email.getValue().replierName()).isEqualTo("Eric Tchana");
        assertThat(email.getValue().articlePath()).isEqualTo("/blog/docker-sans-peur#commentaire-" + root.getId());
    }

    @Test
    @DisplayName("answering one's own comment sends no email; a draft takes no comment at all")
    void ownReplyAndDrafts() {
        Comment root = comment(awa, null);

        service.post("awa@example.com", ARTICLE, new CommentDraft("Je complète mon message", root.getId()));
        verify(mailer, never()).send(any());

        assertThatThrownBy(() -> service.post("awa@example.com", Target.article(8L), new CommentDraft("Bonjour", null)))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("a reply must answer a comment of the same page")
    void replyStaysOnItsPage() {
        Comment elsewhere = comments.save(Comment.builder().targetType(ARTICLE.type()).targetId(9L).authorId(1L).body("Ailleurs").build());

        assertThatThrownBy(() -> service.post("eric@example.com", ARTICLE, new CommentDraft("Réponse", elsewhere.getId())))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("ten comments in ten minutes is the limit")
    void limitsBursts() {
        for (int i = 0; i < 10; i++) comment(awa, null);

        assertThatThrownBy(() -> service.post("awa@example.com", ARTICLE, new CommentDraft("Encore un", null)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("readers see visible comments; a removed one stays as a placeholder only when it was answered")
    void threadsHideRemovedComments() {
        Comment answeredButHidden = comments.save(Comment.builder().targetType(ARTICLE.type()).targetId(7L).authorId(1L).body("x").status(CommentStatus.HIDDEN).build());
        Comment reply = comments.save(Comment.builder().targetType(ARTICLE.type()).targetId(7L).authorId(2L).parentId(answeredButHidden.getId()).body("réponse").build());
        comments.save(Comment.builder().targetType(ARTICLE.type()).targetId(7L).authorId(2L).parentId(answeredButHidden.getId()).body("spam").status(CommentStatus.HIDDEN).build());
        comments.save(Comment.builder().targetType(ARTICLE.type()).targetId(7L).authorId(1L).body("oups").status(CommentStatus.DELETED).build());
        Comment visible = comments.save(Comment.builder().targetType(ARTICLE.type()).targetId(7L).authorId(2L).body("Top").build());

        List<CommentThread> threads = service.listThreads(ARTICLE);

        assertThat(threads).hasSize(2);
        assertThat(threads.get(0).root().author()).isNull();
        assertThat(threads.get(0).replies()).extracting(view -> view.comment().getId()).containsExactly(reply.getId());
        assertThat(threads.get(1).root().comment().getId()).isEqualTo(visible.getId());
    }

    @Test
    @DisplayName("the third report hides the comment, and the queue shows every reason in one go")
    void thirdReportHides() {
        Comment target = comment(awa, null);
        comments.save(target.toBuilder().reportCount(2).build());

        service.report("eric@example.com", target.getId(), " insultant ");

        assertThat(comments.stored(target.getId()).getReportCount()).isEqualTo(3);
        assertThat(comments.stored(target.getId()).getStatus()).isEqualTo(CommentStatus.HIDDEN);
        var queue = service.listForModeration(true, new PageQuery(0, 20));
        assertThat(queue.items()).singleElement().satisfies(moderated -> {
            assertThat(moderated.reasons()).containsExactly("insultant");
            assertThat(moderated.target().path()).isEqualTo("/blog/docker-sans-peur");
        });
    }

    @Test
    @DisplayName("nobody reports their own comment, nor the same comment twice")
    void reportsOncePerMember() {
        Comment target = comment(awa, null);
        service.report("eric@example.com", target.getId(), null);

        assertThatThrownBy(() -> service.report("awa@example.com", target.getId(), null)).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.report("eric@example.com", target.getId(), null)).isInstanceOf(ConflictException.class);
    }

    @Test
    @DisplayName("only the author edits or deletes a comment, and the change is kept")
    void onlyTheAuthorChangesIt() {
        Comment target = comment(awa, null);

        assertThatThrownBy(() -> service.edit("eric@example.com", target.getId(), "Modifié")).isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> service.delete("eric@example.com", target.getId())).isInstanceOf(ForbiddenException.class);

        service.edit("awa@example.com", target.getId(), "Modifié");
        assertThat(comments.stored(target.getId()).getBody()).isEqualTo("Modifié");
        assertThat(comments.stored(target.getId()).getEditedAt()).isNotNull();
        service.delete("awa@example.com", target.getId());
        assertThat(comments.stored(target.getId()).getStatus()).isEqualTo(CommentStatus.DELETED);
    }

    @Test
    @DisplayName("an admin keeping a reported comment clears its reports")
    void keepingClearsReports() {
        Comment target = comments.save(comment(awa, null).toBuilder().status(CommentStatus.HIDDEN).reportCount(3).createdAt(Instant.now()).build());

        service.moderate(target.getId(), CommentStatus.VISIBLE);

        assertThat(comments.stored(target.getId()).getStatus()).isEqualTo(CommentStatus.VISIBLE);
        assertThat(comments.stored(target.getId()).getReportCount()).isZero();
    }
}
