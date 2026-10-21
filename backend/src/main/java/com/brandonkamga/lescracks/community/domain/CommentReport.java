package com.brandonkamga.lescracks.community.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

/** A member flagging a comment for the admin. */
@Entity
@Table(name = "comment_reports")
@IdClass(CommentReport.Key.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentReport {

    @Id
    @Column(name = "comment_id")
    private Long commentId;

    @Id
    @Column(name = "reporter_id")
    private Long reporterId;

    @Column(length = 300)
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public record Key(Long commentId, Long reporterId) implements Serializable {
    }
}
