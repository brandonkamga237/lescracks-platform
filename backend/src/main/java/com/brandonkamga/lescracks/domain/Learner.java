package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Entity
@Table(name = "learners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Learner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Linked user account. Null for manually-created learner profiles (legacy).
     * When set, firstName/lastName/photoUrl are derived from the user at display time.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    /** Slug URL-safe unique : prenom-nom (ex: brandon-kamga) */
    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String photoUrl;
    private String email;
    private String linkedinUrl;
    private String portfolioUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private LearnerStatus status = LearnerStatus.EN_COURS;

    /** Année de cohorte (ex: "2024", "2025") */
    private String cohort;

    /** Affiché dans la section "Nos apprenants" de la landing page */
    @Column(nullable = false)
    @Builder.Default
    private boolean showcased = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean visible = true;

    @Builder.Default
    private int displayOrder = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // ── Evidence ────────────────────────────────────────────────────────────
    // A photo and a bio prove nothing. These are the fields that let a stranger
    // check the claim instead of taking our word for it.

    /** Real start of the accompaniment. With completedAt, gives a MEASURED duration. */
    @Column(name = "started_at")
    private LocalDate startedAt;

    /** Real end. Null while still in progress. */
    @Column(name = "completed_at")
    private LocalDate completedAt;

    /** The learner's own words. Only credible because it sits next to their real name and face. */
    @Column(columnDefinition = "TEXT")
    private String testimonial;

    @Column(name = "github_url")
    private String githubUrl;

    /**
     * What they actually shipped. This is the only part a reader can verify without
     * trusting us, which makes it the most valuable thing on the profile.
     */
    @OneToMany(mappedBy = "learner", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC, id ASC")
    @Builder.Default
    private List<LearnerProject> projects = new ArrayList<>();

    /** Measured duration in months, or empty while the journey is still running. */
    public Optional<Integer> durationInMonths() {
        if (startedAt == null || completedAt == null) return Optional.empty();
        return Optional.of((int) ChronoUnit.MONTHS.between(startedAt, completedAt));
    }
}
