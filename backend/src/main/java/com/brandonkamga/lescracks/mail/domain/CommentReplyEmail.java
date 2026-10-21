package com.brandonkamga.lescracks.mail.domain;

/** Sent to a member when someone answers their comment. */
public record CommentReplyEmail(String to, String firstName, String replierName, String articleTitle, String excerpt,
                                String articlePath) implements Email {
}
