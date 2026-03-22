package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.EventStatus;
import com.brandonkamga.lescracks.domain.EventStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EventStatusRepository extends JpaRepository<EventStatus, Long> {
    Optional<EventStatus> findByName(EventStatusEnum name);
}
