package com.brandonkamga.lescracks.engagement.api;

import com.brandonkamga.lescracks.engagement.api.dto.AdminCommentResponse;
import com.brandonkamga.lescracks.engagement.api.dto.CommentEditRequest;
import com.brandonkamga.lescracks.engagement.api.dto.CommentModerationRequest;
import com.brandonkamga.lescracks.engagement.api.dto.CommentReportRequest;
import com.brandonkamga.lescracks.engagement.api.dto.CommentRequest;
import com.brandonkamga.lescracks.engagement.api.dto.CommentResponse;
import com.brandonkamga.lescracks.engagement.api.dto.CommentThreadResponse;
import com.brandonkamga.lescracks.engagement.application.CommentService;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.shared.dto.PageResponse;
import com.brandonkamga.lescracks.shared.paging.PageQuery;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api")
public class CommentController {
    private static final int MAX_PAGE_SIZE = 100;

    private final CommentService comments;

    public CommentController(CommentService comments) {
        this.comments = comments;
    }

    /** Public: reading needs no account. */
    @GetMapping("/resources/{resourceId}/comments")
    public List<CommentThreadResponse> threads(@PathVariable Long resourceId, Authentication authentication) {
        String viewer = authentication != null ? authentication.getName() : null;
        return comments.listThreads(Target.article(resourceId)).stream().map(thread -> CommentThreadResponse.of(thread, viewer)).toList();
    }

    @PostMapping("/resources/{resourceId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse post(@PathVariable Long resourceId, @Valid @RequestBody CommentRequest request, Principal principal) {
        return CommentResponse.of(comments.post(principal.getName(), Target.article(resourceId), request.toDraft()), principal.getName());
    }

    @PutMapping("/comments/{id}")
    public CommentResponse edit(@PathVariable Long id, @Valid @RequestBody CommentEditRequest request, Principal principal) {
        return CommentResponse.of(comments.edit(principal.getName(), id, request.body()), principal.getName());
    }

    @DeleteMapping("/comments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Principal principal) {
        comments.delete(principal.getName(), id);
    }

    @PostMapping("/comments/{id}/reports")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void report(@PathVariable Long id, @Valid @RequestBody(required = false) CommentReportRequest request, Principal principal) {
        comments.report(principal.getName(), id, request == null ? null : request.reason());
    }

    @GetMapping("/comments/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<AdminCommentResponse> moderation(@RequestParam(defaultValue = "false") boolean reported,
                                                         @RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "20") int size) {
        PageQuery query = new PageQuery(Math.max(0, page), Math.clamp(size, 1, MAX_PAGE_SIZE));
        return PageResponse.of(comments.listForModeration(reported, query), AdminCommentResponse::of);
    }

    @PutMapping("/comments/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminCommentResponse moderate(@PathVariable Long id, @Valid @RequestBody CommentModerationRequest request) {
        return AdminCommentResponse.of(comments.moderate(id, request.status()));
    }

    @DeleteMapping("/comments/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void erase(@PathVariable Long id) {
        comments.erase(id);
    }
}
