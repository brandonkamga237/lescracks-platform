package com.brandonkamga.lescracks.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearnerRequest {

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire")
    private String lastName;

    private String bio;
    private String photoUrl;
    private String email;
    private String linkedinUrl;
    private String portfolioUrl;

    /** EN_COURS | TERMINE_AVEC_CERTIFICAT | TERMINE_SANS_CERTIFICAT */
    private String status;

    private String cohort;

    @Builder.Default
    private boolean showcased = false;

    @Builder.Default
    private boolean visible = true;

    @Builder.Default
    private int displayOrder = 0;

    // ── Evidence ────────────────────────────────────────────────────────────

    /** Real dates. These are what let us publish a MEASURED duration. */
    private LocalDate startedAt;
    private LocalDate completedAt;

    private String testimonial;
    private String githubUrl;

    /** Shipped work, replaced wholesale on update. */
    @Builder.Default
    private List<LearnerProjectRequest> projects = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LearnerProjectRequest {
        @NotBlank(message = "Le titre du projet est obligatoire")
        private String title;

        private String description;
        private String repoUrl;
        private String liveUrl;
        private String imageUrl;

        @Builder.Default
        private int displayOrder = 0;
    }
}
