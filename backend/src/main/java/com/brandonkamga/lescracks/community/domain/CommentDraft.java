package com.brandonkamga.lescracks.community.domain;

/** What a member writes: a comment, or a reply when parentId names the comment answered. */
public record CommentDraft(String body, Long parentId) {
}
