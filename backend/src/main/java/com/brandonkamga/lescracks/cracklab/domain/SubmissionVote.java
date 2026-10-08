package com.brandonkamga.lescracks.cracklab.domain;

import com.brandonkamga.lescracks.identity.domain.User;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** One member's up (+1) or down (-1) vote on a submission; unique per member and submission. */
@Entity
@Table(name = "cracklab_votes", uniqueConstraints = @UniqueConstraint(columnNames = {"submission_id", "user_id"}))
@Getter
@Setter
@NoArgsConstructor
public class SubmissionVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Short value;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
