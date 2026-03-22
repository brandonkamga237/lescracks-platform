package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.EventStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByEventTypeId(Long eventTypeId);
    List<Event> findByEventStatusId(Long eventStatusId);

    // Dashboard analytics methods
    @Query("SELECT COUNT(e) FROM Event e WHERE e.eventStatus.name = :statusName")
    long countByStatus_Name(@Param("statusName") EventStatusEnum statusName);
}
