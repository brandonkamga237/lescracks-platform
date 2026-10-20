package com.brandonkamga.lescracks.event.api.dto;

import com.brandonkamga.lescracks.event.domain.SubmissionStatus;
import com.brandonkamga.lescracks.event.domain.SubmissionView;

import java.time.Instant;
import java.util.List;

public record AdminSubmissionResponse(Long id, String title, String repositoryUrl, String demoUrl, String description,
                                      SubmissionStatus status, Integer score, Integer rank, String reviewNote,
                                      List<TeamMemberResponse> team, Instant submittedAt, Instant updatedAt) {

    public static AdminSubmissionResponse of(SubmissionView view) {
        var submission = view.submission();
        return new AdminSubmissionResponse(submission.getId(), submission.getTitle(), submission.getRepositoryUrl(),
                submission.getDemoUrl(), submission.getDescription(), submission.getStatus(), submission.getScore(),
                submission.getRank(), submission.getReviewNote(),
                view.team().stream().map(member -> TeamMemberResponse.of(member, submission.getOwnerId())).toList(),
                submission.getSubmittedAt(), submission.getUpdatedAt());
    }
}
