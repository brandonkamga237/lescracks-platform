package com.brandonkamga.lescracks.cracklab.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * An engineering problem members answer in writing and an admin grades against its criteria.
 *
 * Getters and setters rather than @Data: the criteria are a bidirectional collection, and a
 * generated equals/hashCode would walk it back and forth.
 */
@Entity
@Table(name = "cracklab_challenges")
@Getter
@Setter
@NoArgsConstructor
public class Challenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 220)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 80)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChallengeDifficulty difficulty;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String problem;

    @Column(name = "constraints", columnDefinition = "TEXT")
    private String constraints;

    @Column(name = "expected_format", length = 300)
    private String expectedFormat;

    /** Word limit enforced on submission; null means none. */
    @Column(name = "max_words")
    private Integer maxWords;

    @Column(name = "reference_solution", nullable = false, columnDefinition = "TEXT")
    private String referenceSolution;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChallengeStatus status = ChallengeStatus.DRAFT;

    /** Username of the admin who created it. */
    @Column(name = "created_by", nullable = false, length = 120)
    private String createdBy;

    @Column(name = "published_at")
    private Instant publishedAt;

    /** Set on a draft that the scheduler will publish at that time. */
    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @ElementCollection
    @CollectionTable(name = "cracklab_challenge_tags", joinColumns = @JoinColumn(name = "challenge_id"))
    @Column(name = "tag", length = 60)
    private Set<String> tags = new LinkedHashSet<>();

    @OneToMany(mappedBy = "challenge", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<ChallengeCriterion> criteria = new ArrayList<>();

    public int totalPoints() {
        return criteria.stream().mapToInt(ChallengeCriterion::getMaxPoints).sum();
    }
}
