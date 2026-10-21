package com.brandonkamga.lescracks.community.infra;

import com.brandonkamga.lescracks.community.domain.CommentReport;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentReportRepository extends JpaRepository<CommentReport, CommentReport.Key> {

    boolean existsByCommentIdAndReporterId(Long commentId, Long reporterId);

    List<CommentReport> findByCommentIdOrderByCreatedAtDesc(Long commentId);
}
