package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.ApplicationType;
import com.brandonkamga.lescracks.domain.ApplicationTypeName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ApplicationTypeRepository extends JpaRepository<ApplicationType, Long> {
    Optional<ApplicationType> findByName(ApplicationTypeName name);
}
