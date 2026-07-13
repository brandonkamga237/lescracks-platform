package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.ResourceComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourceCommentRepository extends JpaRepository<ResourceComment, Long> {

    List<ResourceComment> findByResource_IdOrderByCreatedAtDesc(Long resourceId);

    long countByResource_Id(Long resourceId);
}
