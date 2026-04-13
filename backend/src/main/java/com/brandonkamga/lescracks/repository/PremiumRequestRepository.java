package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.PremiumRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PremiumRequestRepository extends JpaRepository<PremiumRequest, Long> {

    Optional<PremiumRequest> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    Page<PremiumRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    boolean existsByUserId(Long userId);
}
