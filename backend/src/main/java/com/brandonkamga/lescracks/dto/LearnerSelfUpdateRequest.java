package com.brandonkamga.lescracks.dto;

import lombok.Data;

/**
 * Fields an authenticated learner can edit themselves from their profile page.
 * Admin-only fields (showcased, visible, displayOrder, status, cohort) are excluded.
 */
@Data
public class LearnerSelfUpdateRequest {
    private String bio;
    private String linkedinUrl;
    private String portfolioUrl;
}
