package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.ExternalVideoReference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExternalVideoReferenceRepository extends JpaRepository<ExternalVideoReference, Long> {
    Optional<ExternalVideoReference> findByResourceId(Long resourceId);
}