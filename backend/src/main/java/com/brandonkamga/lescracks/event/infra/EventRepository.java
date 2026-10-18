package com.brandonkamga.lescracks.event.infra;

import com.brandonkamga.lescracks.event.domain.Event;
import com.brandonkamga.lescracks.event.domain.EventFormat;
import com.brandonkamga.lescracks.event.domain.EventStatus;
import com.brandonkamga.lescracks.event.domain.EventType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.Instant;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    @Query("select e.id from Event e where e.status = :status and e.scheduledAt <= :now order by e.scheduledAt")
    List<Long> findScheduledIds(@Param("status") EventStatus status, @Param("now") Instant now);


    Optional<Event> findBySlug(String slug);

    List<Event> findBySlugIn(Collection<String> slugs);

    List<Event> findByStatus(EventStatus status);

    boolean existsBySlug(String slug);
    @Query("select e.status, count(e) from Event e group by e.status")
    List<Object[]> countGroupedByStatus();

    @Query("select e.type, count(e) from Event e group by e.type")
    List<Object[]> countGroupedByType();

    Page<Event> findByStatusOrderByStartDateAsc(EventStatus status, Pageable pageable);
    Page<Event> findByStatusAndTypeOrderByStartDateAsc(EventStatus status, EventType type, Pageable pageable);
    Page<Event> findByStatusAndFormatOrderByStartDateAsc(EventStatus status, EventFormat format, Pageable pageable);
    Page<Event> findByStatusAndTypeAndFormatOrderByStartDateAsc(EventStatus status, EventType type, EventFormat format, Pageable pageable);

    /** Not started yet, or started and not over: a hackathon running for two weeks is still ahead of its participants. */
    @Query("""
            select e from Event e
            where e.status = :status and (e.startDate > :now or e.endDate > :now)
            order by e.startDate asc
            """)
    Page<Event> findUpcoming(@Param("status") EventStatus status, @Param("now") Instant now, Pageable pageable);

    @Query("""
            select e from Event e
            where e.status = :status and e.startDate <= :now and (e.endDate is null or e.endDate <= :now)
            order by e.startDate desc
            """)
    Page<Event> findPast(@Param("status") EventStatus status, @Param("now") Instant now, Pageable pageable);
}
