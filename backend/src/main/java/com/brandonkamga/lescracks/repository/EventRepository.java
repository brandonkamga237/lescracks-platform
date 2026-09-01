package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.EventKind;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    Optional<Event> findBySlug(String slug);

    boolean existsBySlug(String slug);

    /** What the public sees: published, optionally narrowed to bootcamps or workshops. */
    @Query("""
            SELECT e FROM Event e
            WHERE e.published = TRUE
              AND (:kind IS NULL OR e.kind = :kind)
            ORDER BY e.startsAt DESC
            """)
    Page<Event> findPublished(EventKind kind, Pageable pageable);

    /** Still to come, for the handful shown on the landing page. */
    @Query("""
            SELECT e FROM Event e
            WHERE e.published = TRUE AND e.startsAt > :now
            ORDER BY e.startsAt ASC
            """)
    Page<Event> findUpcoming(Instant now, Pageable pageable);
}
