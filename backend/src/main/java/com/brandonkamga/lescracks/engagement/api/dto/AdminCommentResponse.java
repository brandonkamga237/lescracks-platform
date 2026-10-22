package com.brandonkamga.lescracks.engagement.api.dto;

import com.brandonkamga.lescracks.engagement.application.ModeratedComment;
import com.brandonkamga.lescracks.engagement.domain.model.CommentStatus;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;

import java.time.Instant;
import java.util.List;

/** {@code target} is null when the content was deleted since. */
public record AdminCommentResponse(Long id, Long parentId, String body, CommentStatus status, int reportCount, List<String> reasons,
                                   Instant createdAt, Instant editedAt, Author author, Target target) {

    public record Author(Long id, String name, String email) {
    }

    public record Target(TargetType type, Long id, String title, String path) {
    }

    public static AdminCommentResponse of(ModeratedComment moderated) {
        var comment = moderated.comment();
        var member = moderated.author();
        var page = moderated.target();
        Author author = member == null ? null : new Author(member.getId(),
                ((member.getFirstName() == null ? "" : member.getFirstName()) + " " + (member.getLastName() == null ? "" : member.getLastName())).trim(),
                member.getEmail());
        return new AdminCommentResponse(comment.getId(), comment.getParentId(), comment.getBody(), comment.getStatus(), comment.getReportCount(),
                moderated.reasons(), comment.getCreatedAt(), comment.getEditedAt(), author,
                page == null ? null : new Target(comment.getTargetType(), page.id(), page.title(), page.path()));
    }
}
