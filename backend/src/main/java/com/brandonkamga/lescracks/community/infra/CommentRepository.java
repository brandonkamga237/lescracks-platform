package com.brandonkamga.lescracks.community.infra;

import com.brandonkamga.lescracks.community.domain.Comment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByResourceIdOrderByCreatedAtAsc(Long resourceId);

    long countByAuthorIdAndCreatedAtAfter(Long authorId, Instant since);

    @Query("select c from Comment c where c.status <> com.brandonkamga.lescracks.community.domain.CommentStatus.DELETED order by c.createdAt desc")
    Page<Comment> findRecent(Pageable pageable);

    @Query("select c from Comment c where c.reportCount > 0 and c.status <> com.brandonkamga.lescracks.community.domain.CommentStatus.DELETED"
            + " order by c.reportCount desc, c.createdAt desc")
    Page<Comment> findReported(Pageable pageable);
}
