package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.ResourceLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ResourceLikeRepository extends JpaRepository<ResourceLike, Long> {

    long countByResource_Id(Long resourceId);

    boolean existsByResource_IdAndUser_Id(Long resourceId, Long userId);

    Optional<ResourceLike> findByResource_IdAndUser_Id(Long resourceId, Long userId);

    void deleteByResource_IdAndUser_Id(Long resourceId, Long userId);
}
