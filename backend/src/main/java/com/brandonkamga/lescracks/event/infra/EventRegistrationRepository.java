package com.brandonkamga.lescracks.event.infra;

import com.brandonkamga.lescracks.event.domain.EventRegistration;
import com.brandonkamga.lescracks.event.domain.RegistrationStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {

    Optional<EventRegistration> findByEventIdAndUserId(Long eventId, Long userId);

    List<EventRegistration> findByEventIdOrderByCreatedAtAsc(Long eventId);

    @Query("select r from EventRegistration r join fetch r.event where r.userId = :userId and r.status in :statuses order by r.event.startDate desc")
    List<EventRegistration> findForMember(@Param("userId") Long userId, @Param("statuses") Collection<RegistrationStatus> statuses);

    /** Atomic, so two members signing up at the same moment both count. */
    @Modifying
    @Query(value = "update events set registration_count = greatest(registration_count + :delta, 0) where id = :eventId", nativeQuery = true)
    void shiftRegistrationCount(@Param("eventId") Long eventId, @Param("delta") int delta);
}
