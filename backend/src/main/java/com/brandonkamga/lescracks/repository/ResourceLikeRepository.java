package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.ResourceLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface ResourceLikeRepository extends JpaRepository<ResourceLike, Long> {

    Optional<ResourceLike> findByResourceIdAndUserEmail(Long resourceId, String userEmail);

    long countByResourceId(Long resourceId);

    boolean existsByResourceIdAndUserEmail(Long resourceId, String userEmail);

    @Query("SELECT COUNT(l) FROM ResourceLike l WHERE l.resource.id = ?1")
    long countLikesByResourceId(Long resourceId);

    void deleteByResourceIdAndUserEmail(Long resourceId, String userEmail);
}
