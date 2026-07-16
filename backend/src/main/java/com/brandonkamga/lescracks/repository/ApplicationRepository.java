package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByUserId(Long userId);
    List<Application> findByEventId(Long eventId);
    List<Application> findByApplicationTypeId(Long applicationTypeId);

    /** Active = not archived. Split by whether it targets an event (registration) or not (360). */
    long countByArchivedAtIsNullAndEventIsNull();       // active 360 applications
    long countByArchivedAtIsNullAndEventIsNotNull();    // active event registrations
    long countByArchivedAtIsNotNull();                  // archived, either kind

    /** How many people have registered for an event. Used to derive live capacity. */
    long countByEvent_Id(Long eventId);

    /** One seat per person: stops the same account registering twice for an event. */
    boolean existsByUser_IdAndEvent_Id(Long userId, Long eventId);
    Page<Application> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
