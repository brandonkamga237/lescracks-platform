package com.brandonkamga.lescracks.community.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/** Comments under articles: posting, replying, reporting, and the admin's review. */
public interface CommentService {

    /** What readers see: hidden and deleted comments are gone, kept only as a placeholder when replies hang off them. */
    List<CommentThread> threads(Long resourceId);

    CommentView post(String email, Long resourceId, CommentDraft draft);

    CommentView edit(String email, Long commentId, String body);

    void delete(String email, Long commentId);

    void report(String email, Long commentId, String reason);

    Page<ModeratedComment> moderation(boolean reportedOnly, Pageable pageable);

    /** VISIBLE keeps or restores a comment and clears its reports; HIDDEN takes it off the article. */
    ModeratedComment moderate(Long commentId, CommentStatus status);

    void erase(Long commentId);
}
