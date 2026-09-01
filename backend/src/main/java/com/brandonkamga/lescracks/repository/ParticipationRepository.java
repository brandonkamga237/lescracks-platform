package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.EnrolmentTarget;
import com.brandonkamga.lescracks.domain.Participation;
import com.brandonkamga.lescracks.domain.ParticipationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ParticipationRepository extends JpaRepository<Participation, Long> {

    List<Participation> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<Participation> findByStatusOrderByCreatedAtDesc(ParticipationStatus status, Pageable pageable);

    Optional<Participation> findByApplicationId(Long applicationId);

    long countByStatus(ParticipationStatus status);

    /** Whether this person is already following the same thing right now. */
    @Query("""
            SELECT COUNT(p) > 0 FROM Participation p
            WHERE p.user.id = :userId
              AND p.status = 'IN_PROGRESS'
              AND p.target = :target
              AND (:eventId IS NULL OR p.event.id = :eventId)
            """)
    boolean hasActiveFor(Long userId, EnrolmentTarget target, Long eventId);

    /** How many people were helped, counted once each however much they followed. */
    @Query("SELECT COUNT(DISTINCT p.user.id) FROM Participation p WHERE p.status = 'COMPLETED'")
    long countPeopleHelped();

    /** The same figure split by what was followed, so the number can be read rather than trusted. */
    @Query("""
            SELECT COALESCE(e.title, 'Accompagnement 360'), COUNT(p)
            FROM Participation p LEFT JOIN p.event e
            WHERE p.status = 'COMPLETED'
            GROUP BY e.title
            ORDER BY COUNT(p) DESC
            """)
    List<Object[]> countCompletedByTarget();
}
