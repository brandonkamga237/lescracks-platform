package com.brandonkamga.lescracks.engagement.application;

import java.util.List;

/** A top-level comment and its replies, oldest first. */
public record CommentThread(CommentView root, List<CommentView> replies) {
}
