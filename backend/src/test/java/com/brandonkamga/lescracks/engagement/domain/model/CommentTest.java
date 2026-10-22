package com.brandonkamga.lescracks.engagement.domain.model;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CommentTest {

    @Test
    @DisplayName("an empty or overlong comment is refused, and invisible characters are dropped")
    void cleansTheBody() {
        assertThatThrownBy(() -> Comment.clean(" \n ")).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> Comment.clean("a".repeat(2001))).isInstanceOf(BadRequestException.class);
        assertThat(Comment.clean("Salut\u0007\n\n\n\nça va")).isEqualTo("Salut\n\nça va");
    }

    @Test
    @DisplayName("a hidden or deleted comment cannot be edited, and the admin cannot delete through moderation")
    void rules() {
        Comment hidden = Comment.builder().status(CommentStatus.HIDDEN).build();
        assertThatThrownBy(() -> hidden.edit("Nouveau texte")).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> hidden.moderate(CommentStatus.DELETED)).isInstanceOf(BadRequestException.class);

        Comment deleted = Comment.builder().status(CommentStatus.DELETED).build();
        assertThatThrownBy(() -> deleted.moderate(CommentStatus.VISIBLE)).isInstanceOf(BadRequestException.class);
    }
}
