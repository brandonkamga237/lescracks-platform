package com.brandonkamga.lescracks.cracklab.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One line of a challenge's rubric: what is judged and how many points it is worth. */
@Entity
@Table(name = "cracklab_criteria")
@Getter
@Setter
@NoArgsConstructor
public class ChallengeCriterion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "challenge_id", nullable = false)
    private Challenge challenge;

    @Column(nullable = false, length = 200)
    private String label;

    @Column(name = "max_points", nullable = false)
    private Integer maxPoints;

    @Column(nullable = false)
    private Integer position;
}
