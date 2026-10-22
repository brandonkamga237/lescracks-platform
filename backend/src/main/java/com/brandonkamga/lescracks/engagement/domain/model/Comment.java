package com.brandonkamga.lescracks.engagement.domain.model;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** A member's comment under a piece of content, or a reply to one (parentId set). */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class Comment {

    public static final int MAX_LENGTH = 2000;
    /** Post-moderation needs a fuse for the hours the admin is away. */
    public static final int HIDE_AFTER_REPORTS = 3;

    private Long id;

    private TargetType targetType;

    private Long targetId;

    private Long authorId;

    private Long parentId;

    private String body;

    @Builder.Default
    private CommentStatus status = CommentStatus.VISIBLE;

    private int reportCount;

    @Builder.Default
    private Instant createdAt = Instant.now();

    private Instant editedAt;

    public Target target() {
        return new Target(targetType, targetId);
    }

    public boolean isVisible() {
        return status == CommentStatus.VISIBLE;
    }

    public boolean isReply() {
        return parentId != null;
    }

    public void edit(String text) {
        if (!isVisible()) throw new BadRequestException("Ce commentaire ne peut plus être modifié.");
        body = clean(text);
        editedAt = Instant.now();
    }

    /** One more report; enough of them hide the comment until the admin looks. */
    public void reported() {
        reportCount++;
        if (isVisible() && reportCount >= HIDE_AFTER_REPORTS) status = CommentStatus.HIDDEN;
    }

    /** VISIBLE keeps or restores a comment and clears its reports; HIDDEN takes it off the page. */
    public void moderate(CommentStatus decision) {
        if (decision == CommentStatus.DELETED) throw new BadRequestException("Pour supprimer un commentaire, utilise la suppression.");
        if (status == CommentStatus.DELETED) throw new BadRequestException("Son auteur a supprimé ce commentaire.");
        status = decision;
        if (decision == CommentStatus.VISIBLE) reportCount = 0;
    }

    /** Plain text, trimmed, without runs of blank lines or invisible control characters. */
    public static String clean(String body) {
        String text = body == null ? "" : body.replaceAll("[\\p{Cntrl}&&[^\n\t]]", "").replaceAll("\n{3,}", "\n\n").strip();
        if (text.length() < 2) throw new BadRequestException("Ton commentaire est vide.");
        if (text.length() > MAX_LENGTH) throw new BadRequestException("Ton commentaire dépasse " + MAX_LENGTH + " caractères.");
        return text;
    }
}
