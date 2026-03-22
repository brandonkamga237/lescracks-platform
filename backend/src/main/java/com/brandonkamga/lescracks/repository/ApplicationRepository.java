package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByUserId(Long userId);
    List<Application> findByEventId(Long eventId);
    List<Application> findByApplicationTypeId(Long applicationTypeId);
}
