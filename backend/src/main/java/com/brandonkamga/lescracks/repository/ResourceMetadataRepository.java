package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.ResourceMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResourceMetadataRepository extends JpaRepository<ResourceMetadata, Long> {
    Optional<ResourceMetadata> findByResourceId(Long resourceId);
}
