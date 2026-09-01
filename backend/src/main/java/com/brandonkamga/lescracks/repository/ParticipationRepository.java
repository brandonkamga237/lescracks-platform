package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Participation;
import com.brandonkamga.lescracks.domain.ParticipationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParticipationRepository extends JpaRepository<Participation, Long> {

    List<Participation> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<Participation> findByStatusOrderByCreatedAtDesc(ParticipationStatus status, Pageable pageable);

    boolean existsByUserIdAndEventId(Long userId, Long eventId);

    Optional<Participation> findByApplicationId(Long applicationId);

    long countByStatus(ParticipationStatus status);

    /** The proof-of-work figure: how many people completed something, counted once each. */
    @Query("SELECT COUNT(DISTINCT p.user.id) FROM Participation p WHERE p.status = 'COMPLETED'")
    long countDistinctCompletedParticipants();

    /** Completions split by programme, for the same figure broken down. */
    @Query("SELECT COALESCE(e.title, 'Accompagnement 360'), COUNT(p) FROM Participation p "
            + "LEFT JOIN p.event e WHERE p.status = 'COMPLETED' GROUP BY e.title ORDER BY COUNT(p) DESC")
    List<Object[]> countCompletedByProgramme();
}
