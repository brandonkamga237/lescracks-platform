package com.brandonkamga.lescracks.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

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
}
