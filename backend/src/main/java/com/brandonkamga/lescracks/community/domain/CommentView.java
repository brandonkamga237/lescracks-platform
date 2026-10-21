package com.brandonkamga.lescracks.community.domain;

import com.brandonkamga.lescracks.identity.domain.User;

/** A comment with its author, who is null once the comment is no longer shown. */
public record CommentView(Comment comment, User author) {
}
