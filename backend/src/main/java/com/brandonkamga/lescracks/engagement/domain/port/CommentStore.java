package com.brandonkamga.lescracks.engagement.domain.port;

import com.brandonkamga.lescracks.engagement.domain.model.Comment;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface CommentStore {

    Optional<Comment> findById(Long id);

    /** Oldest first, every status: the reader view decides what shows. */
    List<Comment> findByTarget(Target target);

    long countByAuthorSince(Long authorId, Instant since);

    /** Not deleted; reported ones by most reports first, otherwise newest first. */
    Paged<Comment> findForModeration(boolean reportedOnly, PageQuery page);

    Comment save(Comment comment);

    void delete(Long id);

    void deleteByTarget(Target target);
}
