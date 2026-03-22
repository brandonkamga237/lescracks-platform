package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.PremiumRequest;
import com.brandonkamga.lescracks.domain.PremiumRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PremiumRequestRepository extends JpaRepository<PremiumRequest, Long> {

    List<PremiumRequest> findByUserId(Long userId);

    Optional<PremiumRequest> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    Page<PremiumRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<PremiumRequest> findByStatusOrderByCreatedAtDesc(PremiumRequestStatus status, Pageable pageable);

    long countByStatus(PremiumRequestStatus status);
}
