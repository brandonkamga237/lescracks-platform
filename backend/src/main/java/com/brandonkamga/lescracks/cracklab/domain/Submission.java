package com.brandonkamga.lescracks.cracklab.domain;

import com.brandonkamga.lescracks.identity.domain.User;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A member's written answer to a challenge. Final once submitted: the reference solution and
 * the other answers become visible right after, so an edit would let anyone copy them.
 */
@Entity
@Table(name = "cracklab_submissions")
@Getter
@Setter
@NoArgsConstructor
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "challenge_id", nullable = false)
    private Challenge challenge;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    /** Sum of the rubric points; null until graded. Votes never write here. */
    @Column(name = "technical_score")
    private Integer technicalScore;

    /** Community signal, kept apart from the technical score. */
    @Column(name = "vote_score", nullable = false)
    private Integer voteScore = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubmissionStatus status = SubmissionStatus.SUBMITTED;

    @Column(name = "graded_by", length = 120)
    private String gradedBy;

    @Column(name = "graded_at")
    private Instant gradedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SubmissionEvaluation> evaluations = new ArrayList<>();
}
