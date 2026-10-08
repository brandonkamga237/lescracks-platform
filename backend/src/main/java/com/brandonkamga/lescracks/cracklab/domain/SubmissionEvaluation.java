package com.brandonkamga.lescracks.cracklab.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Points and feedback an admin gave a submission on one criterion. */
@Entity
@Table(name = "cracklab_evaluations")
@Getter
@Setter
@NoArgsConstructor
public class SubmissionEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "criterion_id", nullable = false)
    private ChallengeCriterion criterion;

    @Column(nullable = false)
    private Integer points;

    @Column(columnDefinition = "TEXT")
    private String feedback;
}
