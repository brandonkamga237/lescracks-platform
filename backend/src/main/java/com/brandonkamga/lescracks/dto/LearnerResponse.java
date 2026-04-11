package com.brandonkamga.lescracks.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearnerResponse {

    private Long id;
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
}
