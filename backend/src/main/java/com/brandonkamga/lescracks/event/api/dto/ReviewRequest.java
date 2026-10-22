package com.brandonkamga.lescracks.event.api.dto;

import com.brandonkamga.lescracks.event.application.ProjectReview;
import com.brandonkamga.lescracks.event.domain.model.SubmissionStatus;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record ReviewRequest(SubmissionStatus status, @Min(0) @Max(100) Integer score, @Min(1) @Max(10) Integer rank,
                            @Size(max = 2000) String note) {

    public ProjectReview toReview() {
        return new ProjectReview(status, score, rank, note);
    }
}
