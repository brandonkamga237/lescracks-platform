package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Application;
import com.brandonkamga.lescracks.domain.ApplicationStatus;
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
    long countByStatus(ApplicationStatus status);
    Page<Application> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
