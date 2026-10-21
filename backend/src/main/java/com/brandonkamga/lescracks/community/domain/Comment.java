package com.brandonkamga.lescracks.community.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** A member's comment under an article, or a reply to one (parentId set). */
@Entity
@Table(name = "comments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "resource_id", nullable = false, updatable = false)
    private Long resourceId;

    @Column(name = "author_id", nullable = false, updatable = false)
    private Long authorId;

    @Column(name = "parent_id", updatable = false)
    private Long parentId;

    @Column(nullable = false, length = 2000)
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CommentStatus status = CommentStatus.VISIBLE;

    @Column(name = "report_count", nullable = false)
    private int reportCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "edited_at")
    private Instant editedAt;

    public boolean isVisible() {
        return status == CommentStatus.VISIBLE;
    }

    public boolean isReply() {
        return parentId != null;
    }
}
