package com.brandonkamga.lescracks.community.api.dto;

import com.brandonkamga.lescracks.community.domain.CommentStatus;
import com.brandonkamga.lescracks.community.domain.ModeratedComment;

import java.time.Instant;
import java.util.List;

public record AdminCommentResponse(Long id, Long parentId, String body, CommentStatus status, int reportCount, List<String> reasons,
                                   Instant createdAt, Instant editedAt, Author author, Article article) {

    public record Author(Long id, String name, String email) {
    }

    public record Article(Long id, String title, String slug) {
    }

    public static AdminCommentResponse of(ModeratedComment moderated) {
        var comment = moderated.comment();
        var member = moderated.author();
        var resource = moderated.resource();
        Author author = member == null ? null : new Author(member.getId(),
                ((member.getFirstName() == null ? "" : member.getFirstName()) + " " + (member.getLastName() == null ? "" : member.getLastName())).trim(),
                member.getEmail());
        return new AdminCommentResponse(comment.getId(), comment.getParentId(), comment.getBody(), comment.getStatus(), comment.getReportCount(),
                moderated.reasons(), comment.getCreatedAt(), comment.getEditedAt(), author,
                new Article(resource.getId(), resource.getTitle(), resource.getSlug()));
    }
}
