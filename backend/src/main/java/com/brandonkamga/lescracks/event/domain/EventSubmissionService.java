package com.brandonkamga.lescracks.event.domain;

import java.util.List;
import java.util.Optional;

/** Projects handed in for an event on the platform, and their review by the admin. */
public interface EventSubmissionService {

    /** Creates the member's project, or updates it while it is still open to changes. */
    SubmissionView submit(Long eventId, String email, ProjectDraft draft);

    /** The project the member is named on for this event, as owner or teammate. */
    Optional<SubmissionView> mine(Long eventId, String email);

    List<SubmissionView> forEvent(Long eventId);

    SubmissionView review(Long submissionId, ProjectReview review);
}
