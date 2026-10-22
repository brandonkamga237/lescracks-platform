package com.brandonkamga.lescracks.community.api.dto;

import com.brandonkamga.lescracks.community.domain.CommentView;
import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.storage.domain.StoredFiles;

import java.time.Instant;

/**
 * A comment as readers see it. A removed comment kept for its replies carries neither author nor
 * body. The author shows as on their public profile: never an email.
 */
public record CommentResponse(Long id, Long parentId, Author author, String body, Instant createdAt, Instant editedAt,
                              boolean removed, boolean mine) {

    public record Author(Long id, String name, String avatarUrl) {
    }

    public static CommentResponse of(CommentView view, String viewerEmail) {
        var comment = view.comment();
        User author = view.author();
        if (author == null) {
            return new CommentResponse(comment.getId(), comment.getParentId(), null, null, comment.getCreatedAt(), null, true, false);
        }
        String name = ((author.getFirstName() == null ? "" : author.getFirstName()) + " " + (author.getLastName() == null ? "" : author.getLastName())).trim();
        boolean mine = viewerEmail != null && viewerEmail.equalsIgnoreCase(author.getEmail());
        return new CommentResponse(comment.getId(), comment.getParentId(),
                new Author(author.getId(), name.isEmpty() ? "Membre LesCracks" : name, StoredFiles.publicPath(author.getAvatarUrl())),
                comment.getBody(), comment.getCreatedAt(), comment.getEditedAt(), false, mine);
    }
}
