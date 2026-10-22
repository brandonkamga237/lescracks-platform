package com.brandonkamga.lescracks.engagement.application;

/** What a member writes: a comment, or a reply when parentId names the comment answered. */
public record CommentDraft(String body, Long parentId) {
}
