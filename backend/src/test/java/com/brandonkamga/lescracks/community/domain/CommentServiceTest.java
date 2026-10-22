package com.brandonkamga.lescracks.community.domain;

import com.brandonkamga.lescracks.community.infra.CommentReportRepository;
import com.brandonkamga.lescracks.community.infra.CommentRepository;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.mail.domain.CommentReplyEmail;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.resource.domain.Resource;
import com.brandonkamga.lescracks.resource.domain.ResourceService;
import com.brandonkamga.lescracks.resource.domain.ResourceStatus;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;
import com.brandonkamga.lescracks.shared.exception.ForbiddenException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CommentServiceTest {

    @Mock private CommentRepository comments;
    @Mock private CommentReportRepository reports;
    @Mock private ResourceService resources;
    @Mock private MemberDirectory people;
    @Mock private Mailer mailer;

    private CommentServiceImpl service;
    private final Resource article = Resource.builder().id(7L).title("Docker sans peur").slug("docker-sans-peur").status(ResourceStatus.PUBLISHED).build();
    private final Member awa = Member.builder().id(1L).email("awa@example.com").firstName("Awa").lastName("Diallo").build();
    private final Member eric = Member.builder().id(2L).email("eric@example.com").firstName("Eric").lastName("Tchana").build();

    @BeforeEach
    void setUp() {
        service = new CommentServiceImpl(comments, reports, resources, people, mailer);
        when(resources.requirePublished(7L)).thenReturn(article);
        when(resources.require(7L)).thenReturn(article);
        when(people.require("awa@example.com")).thenReturn(awa);
        when(people.require("eric@example.com")).thenReturn(eric);
        when(people.require(1L)).thenReturn(awa);
        when(people.findAll(anyCollection())).thenReturn(Map.of(1L, awa, 2L, eric));
        when(comments.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment saved = invocation.getArgument(0);
            if (saved.getId() == null) saved.setId(99L);
            return saved;
        });
    }

    private Comment comment(long id, Member author, Long parentId) {
        Comment comment = Comment.builder().id(id).resourceId(7L).authorId(author.getId()).parentId(parentId).body("Merci !").build();
        when(comments.findById(id)).thenReturn(Optional.of(comment));
        return comment;
    }

    @Test
    @DisplayName("answering a reply joins its thread, and the author of the thread's comment is emailed")
    void replyJoinsTheThreadAndNotifies() {
        comment(10L, awa, null);
        comment(11L, awa, 10L);

        CommentView reply = service.post("eric@example.com", 7L, new CommentDraft("  Bien vu, merci  ", 11L));

        assertThat(reply.comment().getParentId()).isEqualTo(10L);
        assertThat(reply.comment().getBody()).isEqualTo("Bien vu, merci");
        ArgumentCaptor<CommentReplyEmail> email = ArgumentCaptor.forClass(CommentReplyEmail.class);
        verify(mailer).send(email.capture());
        assertThat(email.getValue().to()).isEqualTo("awa@example.com");
        assertThat(email.getValue().replierName()).isEqualTo("Eric Tchana");
        assertThat(email.getValue().articlePath()).isEqualTo("/blog/docker-sans-peur#commentaire-10");
    }

    @Test
    @DisplayName("answering one's own comment sends no email")
    void ownReplyIsSilent() {
        comment(10L, awa, null);

        service.post("awa@example.com", 7L, new CommentDraft("Je complète mon message", 10L));

        verify(mailer, never()).send(any());
    }

    @Test
    @DisplayName("an empty or overlong comment is refused, and invisible characters are dropped")
    void checksTheBody() {
        assertThatThrownBy(() -> service.post("awa@example.com", 7L, new CommentDraft(" \n ", null))).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.post("awa@example.com", 7L, new CommentDraft("a".repeat(2001), null))).isInstanceOf(BadRequestException.class);
        assertThat(CommentServiceImpl.cleaned("Salut\u0007\n\n\n\nça va")).isEqualTo("Salut\n\nça va");
    }

    @Test
    @DisplayName("ten comments in ten minutes is the limit")
    void limitsBursts() {
        when(comments.countByAuthorIdAndCreatedAtAfter(eq(1L), any())).thenReturn(10L);

        assertThatThrownBy(() -> service.post("awa@example.com", 7L, new CommentDraft("Encore un", null))).isInstanceOf(BadRequestException.class);
        verify(comments, never()).save(any());
    }

    @Test
    @DisplayName("readers see visible comments; a removed one stays as a placeholder only when it was answered")
    void threadsHideRemovedComments() {
        Comment answeredButHidden = Comment.builder().id(1L).resourceId(7L).authorId(1L).body("x").status(CommentStatus.HIDDEN).build();
        Comment reply = Comment.builder().id(2L).resourceId(7L).authorId(2L).parentId(1L).body("réponse").build();
        Comment hiddenReply = Comment.builder().id(3L).resourceId(7L).authorId(2L).parentId(1L).body("spam").status(CommentStatus.HIDDEN).build();
        Comment deletedAlone = Comment.builder().id(4L).resourceId(7L).authorId(1L).body("oups").status(CommentStatus.DELETED).build();
        Comment visible = Comment.builder().id(5L).resourceId(7L).authorId(2L).body("Top").build();
        when(comments.findByResourceIdOrderByCreatedAtAsc(7L)).thenReturn(List.of(answeredButHidden, reply, hiddenReply, deletedAlone, visible));

        List<CommentThread> threads = service.threads(7L);

        assertThat(threads).hasSize(2);
        assertThat(threads.get(0).root().author()).isNull();
        assertThat(threads.get(0).replies()).extracting(view -> view.comment().getId()).containsExactly(2L);
        assertThat(threads.get(1).root().comment().getId()).isEqualTo(5L);
    }

    @Test
    @DisplayName("the third report hides the comment until the admin reviews it")
    void thirdReportHides() {
        Comment comment = comment(10L, awa, null);
        comment.setReportCount(2);

        service.report("eric@example.com", 10L, " insultant ");

        assertThat(comment.getReportCount()).isEqualTo(3);
        assertThat(comment.getStatus()).isEqualTo(CommentStatus.HIDDEN);
        verify(reports).save(any(CommentReport.class));
    }

    @Test
    @DisplayName("nobody reports their own comment, nor the same comment twice")
    void reportsOncePerMember() {
        comment(10L, awa, null);
        when(reports.existsByCommentIdAndReporterId(10L, 2L)).thenReturn(true);

        assertThatThrownBy(() -> service.report("awa@example.com", 10L, null)).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.report("eric@example.com", 10L, null)).isInstanceOf(ConflictException.class);
    }

    @Test
    @DisplayName("only the author edits or deletes a comment")
    void onlyTheAuthorChangesIt() {
        Comment comment = comment(10L, awa, null);

        assertThatThrownBy(() -> service.edit("eric@example.com", 10L, "Modifié")).isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> service.delete("eric@example.com", 10L)).isInstanceOf(ForbiddenException.class);

        service.edit("awa@example.com", 10L, "Modifié");
        assertThat(comment.getBody()).isEqualTo("Modifié");
        assertThat(comment.getEditedAt()).isNotNull();
        service.delete("awa@example.com", 10L);
        assertThat(comment.getStatus()).isEqualTo(CommentStatus.DELETED);
    }

    @Test
    @DisplayName("an admin keeping a reported comment clears its reports")
    void keepingClearsReports() {
        Comment comment = comment(10L, awa, null);
        comment.setStatus(CommentStatus.HIDDEN);
        comment.setReportCount(3);

        service.moderate(10L, CommentStatus.VISIBLE);

        assertThat(comment.getStatus()).isEqualTo(CommentStatus.VISIBLE);
        assertThat(comment.getReportCount()).isZero();
        verify(reports, never()).existsByCommentIdAndReporterId(anyLong(), anyLong());
    }
}
