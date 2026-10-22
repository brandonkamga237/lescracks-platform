package com.brandonkamga.lescracks.event.domain.port;

import com.brandonkamga.lescracks.event.domain.model.Submission;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface SubmissionStore {

    Optional<Submission> findById(Long id);

    /** The project a member is named on for an event, as owner or teammate. */
    Optional<Submission> findByMember(Long eventId, Long userId);

    /** Among these members, those already named on another project of the event than {@code exceptSubmissionId}. */
    Set<Long> findTaken(Long eventId, Collection<Long> userIds, Long exceptSubmissionId);

    /** Ranked projects first, then by score, then the earliest; members in one more query. */
    List<Submission> findByEvent(Long eventId);

    /** Replaces the team with {@code memberIds}. */
    Submission save(Submission submission);
}
