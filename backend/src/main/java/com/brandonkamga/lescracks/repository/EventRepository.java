package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.EventStatus;
import com.brandonkamga.lescracks.domain.EventType;
import com.brandonkamga.lescracks.domain.EventFormat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.Instant;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    @Query("select e.status, count(e) from Event e group by e.status")
    List<Object[]> countGroupedByStatus();

    @Query("select e.type, count(e) from Event e group by e.type")
    List<Object[]> countGroupedByType();

    Page<Event> findByStatusOrderByStartDateAsc(EventStatus status, Pageable pageable);
    Page<Event> findByStatusAndTypeOrderByStartDateAsc(EventStatus status, EventType type, Pageable pageable);
    Page<Event> findByStatusAndFormatOrderByStartDateAsc(EventStatus status, EventFormat format, Pageable pageable);
    Page<Event> findByStatusAndTypeAndFormatOrderByStartDateAsc(EventStatus status, EventType type, EventFormat format, Pageable pageable);
    Page<Event> findByStatusAndStartDateAfterOrderByStartDateAsc(EventStatus status, Instant now, Pageable pageable);
    Page<Event> findByStatusAndStartDateBeforeOrderByStartDateDesc(EventStatus status, Instant now, Pageable pageable);
}
