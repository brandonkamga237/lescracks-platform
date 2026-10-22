package com.brandonkamga.lescracks.event.application;

import java.util.List;
import java.util.Optional;

/** Projects handed in for an event on the platform, and their review by the admin. */
public interface SubmissionService {

    /** Creates the member's project, or updates it while it is still open to changes. */
    SubmissionView submit(Long eventId, String email, ProjectDraft draft);

    /** The project the member is named on for this event, as owner or teammate. */
    Optional<SubmissionView> findMine(Long eventId, String email);

    /** Ranked first; every team in one query. */
    List<SubmissionView> listForEvent(Long eventId);

    SubmissionView review(Long submissionId, ProjectReview review);
}
