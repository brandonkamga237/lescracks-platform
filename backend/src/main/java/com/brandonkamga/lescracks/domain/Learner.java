package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

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
}
