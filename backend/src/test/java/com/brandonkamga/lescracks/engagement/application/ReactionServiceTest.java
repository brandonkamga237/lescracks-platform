package com.brandonkamga.lescracks.engagement.application;

import com.brandonkamga.lescracks.engagement.domain.model.Comment;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReactionServiceTest {

    private static final Target ARTICLE = Target.article(7L);

    private final InMemoryEngagement.Reactions reactions = new InMemoryEngagement.Reactions();
    private final InMemoryEngagement.Comments comments = new InMemoryEngagement.Comments();
    private final MemberDirectory people = mock(MemberDirectory.class);
    private ReactionServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ReactionServiceImpl(reactions, comments, InMemoryEngagement.articles(), people);
        Member awa = Member.builder().id(1L).email("awa@example.com").build();
        when(people.require("awa@example.com")).thenReturn(awa);
        when(people.find("awa@example.com")).thenReturn(Optional.of(awa));
    }

    @Test
    @DisplayName("a visitor counts once per page; a draft collects no views")
    void views() {
        assertThat(service.recordView(ARTICLE, "a:1")).isEqualTo(1);
        assertThat(service.recordView(ARTICLE, "a:1")).isEqualTo(1);
        assertThat(service.recordView(ARTICLE, "a:2")).isEqualTo(2);
        assertThatThrownBy(() -> service.recordView(Target.article(8L), "a:1")).isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("a like counts once per member and is withdrawn; a visitor reads the count without a like of their own")
    void likes() {
        service.like(ARTICLE, "awa@example.com");
        assertThat(service.like(ARTICLE, "awa@example.com")).isEqualTo(new LikeStatus(1, true));
        assertThat(service.viewLikes(ARTICLE, null)).isEqualTo(new LikeStatus(1, false));
        assertThat(service.unlike(ARTICLE, "awa@example.com")).isEqualTo(new LikeStatus(0, false));
    }

    @Test
    @DisplayName("a list reads every figure in one go; content nobody reacted to reads as zero")
    void counts() {
        service.recordView(ARTICLE, "a:1");

        assertThat(service.countsOf(TargetType.ARTICLE, List.of(7L, 9L)))
                .containsEntry(7L, new Counts(1, 0)).containsEntry(9L, Counts.NONE);
    }

    @Test
    @DisplayName("deleting content forgets its views, likes and comments")
    void forgets() {
        service.recordView(ARTICLE, "a:1");
        service.like(ARTICLE, "awa@example.com");
        comments.save(Comment.builder().targetType(TargetType.ARTICLE).targetId(7L).authorId(1L).body("Merci").build());

        service.forget(ARTICLE);

        assertThat(service.countsOf(ARTICLE)).isEqualTo(Counts.NONE);
        assertThat(comments.findByTarget(ARTICLE)).isEmpty();
    }
}
