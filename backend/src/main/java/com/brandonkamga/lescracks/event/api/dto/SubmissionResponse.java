package com.brandonkamga.lescracks.event.api.dto;

import com.brandonkamga.lescracks.event.domain.SubmissionStatus;
import com.brandonkamga.lescracks.event.domain.SubmissionView;

import java.time.Instant;
import java.util.List;

/**
 * A project as its team sees it. editable tells the owner whether changes are still possible;
 * the rank is shown once the project is accepted, the score and the review note stay with the admin.
 */
public record SubmissionResponse(Long id, String title, String repositoryUrl, String demoUrl, String description,
                                 SubmissionStatus status, Integer rank, List<TeamMemberResponse> team, boolean editable,
                                 Instant submittedAt, Instant updatedAt, Instant closesAt) {

    public static SubmissionResponse of(SubmissionView view, String viewerEmail) {
        var submission = view.submission();
        Instant closesAt = view.closesAt();
        boolean owner = view.team().stream().anyMatch(member -> member.getId().equals(submission.getOwnerId())
                && member.getEmail().equalsIgnoreCase(viewerEmail));
        boolean open = submission.getStatus() == SubmissionStatus.SUBMITTED && (closesAt == null || closesAt.isAfter(Instant.now()));
        return new SubmissionResponse(submission.getId(), submission.getTitle(), submission.getRepositoryUrl(), submission.getDemoUrl(),
                submission.getDescription(), submission.getStatus(),
                submission.getStatus() == SubmissionStatus.ACCEPTED ? submission.getRank() : null,
                view.team().stream().map(member -> TeamMemberResponse.of(member, submission.getOwnerId())).toList(),
                owner && open, submission.getSubmittedAt(), submission.getUpdatedAt(), closesAt);
    }
}
