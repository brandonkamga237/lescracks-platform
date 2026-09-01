package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Application;
import com.brandonkamga.lescracks.domain.ApplicationStatus;
import com.brandonkamga.lescracks.domain.EnrolmentTarget;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    Page<Application> findByStatusOrderByCreatedAtDesc(ApplicationStatus status, Pageable pageable);

    Page<Application> findByTargetOrderByCreatedAtDesc(EnrolmentTarget target, Pageable pageable);

    /**
     * Whether this person already has a request open for the same thing. The database refuses
     * the duplicate anyway; asking first is what turns a constraint violation into a sentence
     * the applicant can act on.
     */
    @Query("""
            SELECT COUNT(a) > 0 FROM Application a
            WHERE LOWER(a.email) = LOWER(:email)
              AND a.status = 'PENDING'
              AND a.target = :target
              AND (:eventId IS NULL OR a.event.id = :eventId)
            """)
    boolean hasPendingFor(String email, EnrolmentTarget target, Long eventId);
}
