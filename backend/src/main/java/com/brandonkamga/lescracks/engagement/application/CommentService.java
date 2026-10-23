package com.brandonkamga.lescracks.engagement.application;

import com.brandonkamga.lescracks.engagement.domain.model.CommentStatus;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.util.List;

/** Comments under any content: posting, replying, reporting, and the admin's review. */
public interface CommentService {

    /** What readers see: hidden and deleted comments are gone, kept only as a placeholder when replies hang off them. */
    List<CommentThread> listThreads(Target target);

    CommentView post(String email, Target target, CommentDraft draft);

    CommentView edit(String email, Long commentId, String body);

    void delete(String email, Long commentId);

    void report(String email, Long commentId, String reason);

    Paged<ModeratedComment> listForModeration(boolean reportedOnly, PageQuery page);

    /** VISIBLE keeps or restores a comment and clears its reports; HIDDEN takes it off the page. */
    ModeratedComment moderate(Long commentId, CommentStatus status);

    void erase(Long commentId);

    /** Every comment a member ever posted, for their admin sheet. */
    long countWrittenBy(Long authorId);
}
