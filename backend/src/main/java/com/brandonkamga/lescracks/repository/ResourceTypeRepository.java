package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.ResourceType;
import com.brandonkamga.lescracks.domain.ResourceTypeName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResourceTypeRepository extends JpaRepository<ResourceType, Long> {
    Optional<ResourceType> findByName(ResourceTypeName name);
}
