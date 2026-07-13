package com.brandonkamga.lescracks.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearnerResponse {

    private Long id;
    private Long userId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String slug;
    private String bio;
    private String photoUrl;
    private String email;
    private String linkedinUrl;
    private String portfolioUrl;
    private String status;
    private String cohort;
    private boolean showcased;
    private boolean visible;
    private int displayOrder;
    private LocalDateTime createdAt;

    // ── Evidence ────────────────────────────────────────────────────────────
    // What lets a stranger check the claim instead of trusting us.

    private LocalDate startedAt;
    private LocalDate completedAt;

    /** Measured from the real dates. Null while the journey is still running. */
    private Integer durationMonths;

    /** The learner's own words, attributable to their real name and face. */
    private String testimonial;

    private String githubUrl;

    /** Shipped work. The only part of the profile a reader can verify unaided. */
    private List<LearnerProjectResponse> projects;
}
