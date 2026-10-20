package com.brandonkamga.lescracks.event.infra;

import com.brandonkamga.lescracks.event.domain.EventSubmission;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EventSubmissionRepository extends JpaRepository<EventSubmission, Long> {

    /** The project a member is named on for an event, as owner or teammate. */
    @Query("select s from EventSubmission s join s.members m where s.event.id = :eventId and m.userId = :userId")
    Optional<EventSubmission> findByEventAndMember(@Param("eventId") Long eventId, @Param("userId") Long userId);

    /** Ranked projects first, then by score, then the earliest. */
    @Query("select s from EventSubmission s where s.event.id = :eventId order by coalesce(s.rank, 99), s.score desc nulls last, s.submittedAt")
    List<EventSubmission> findForEvent(@Param("eventId") Long eventId);
}
