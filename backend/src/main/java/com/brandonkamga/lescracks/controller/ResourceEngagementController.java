package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.domain.ResourceComment;
import com.brandonkamga.lescracks.domain.ResourceLike;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.ForbiddenException;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.repository.ResourceCommentRepository;
import com.brandonkamga.lescracks.repository.ResourceLikeRepository;
import com.brandonkamga.lescracks.repository.ResourceRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Likes and comments on a resource.
 *
 * Reading is public — the counts and the discussion are part of what makes a resource
 * worth opening, and hiding them behind a login would defeat the point of a public
 * catalogue. Writing requires an account: an anonymous like is a number nobody can
 * trust, and an anonymous comment is a spam funnel.
 */
@RestController
@RequestMapping("/api/resources/{resourceId}")
@Tag(name = "Resource engagement", description = "Likes et commentaires sur les ressources")
public class ResourceEngagementController {

    private static final int MAX_COMMENT_LENGTH = 2000;

    private final ResourceRepository resourceRepository;
    private final ResourceLikeRepository likeRepository;
    private final ResourceCommentRepository commentRepository;
    private final UserRepository userRepository;

    public ResourceEngagementController(
            ResourceRepository resourceRepository,
            ResourceLikeRepository likeRepository,
            ResourceCommentRepository commentRepository,
            UserRepository userRepository) {
        this.resourceRepository = resourceRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    // ── Likes ───────────────────────────────────────────────────────────────

    /** Public: how many likes, and whether the caller is one of them (false when anonymous). */
    @GetMapping("/likes")
    @Operation(summary = "Nombre de likes et si l'utilisateur courant a liké")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLikes(
            @PathVariable Long resourceId, Authentication authentication) {

        requireResource(resourceId);

        Map<String, Object> body = new HashMap<>();
        body.put("count", likeRepository.countByResource_Id(resourceId));
        body.put("likedByMe", currentUser(authentication)
                .map(u -> likeRepository.existsByResource_IdAndUser_Id(resourceId, u.getId()))
                .orElse(false));

        return ResponseEntity.ok(ApiResponse.success(body));
    }

    /**
     * Toggle: like if not liked, unlike if already liked. One endpoint rather than two,
     * so the button can never get out of step with the server.
     */
    @PostMapping("/likes")
    @Transactional
    @Operation(summary = "Liker / retirer son like (compte requis)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleLike(
            @PathVariable Long resourceId, Authentication authentication) {

        Resource resource = requireResource(resourceId);
        User user = requireUser(authentication, "Connecte-toi pour aimer une ressource.");

        boolean nowLiked;
        if (likeRepository.existsByResource_IdAndUser_Id(resourceId, user.getId())) {
            likeRepository.deleteByResource_IdAndUser_Id(resourceId, user.getId());
            nowLiked = false;
        } else {
            try {
                likeRepository.save(ResourceLike.builder()
                        .resource(resource)
                        .user(user)
                        .createdAt(LocalDateTime.now())
                        .build());
            } catch (DataIntegrityViolationException e) {
                // Two rapid clicks raced past the exists() check. The UNIQUE constraint
                // stopped the duplicate; the user is liked either way, so say so.
            }
            nowLiked = true;
        }

        Map<String, Object> body = new HashMap<>();
        body.put("count", likeRepository.countByResource_Id(resourceId));
        body.put("likedByMe", nowLiked);
        return ResponseEntity.ok(ApiResponse.success(body));
    }

    // ── Comments ────────────────────────────────────────────────────────────

    @GetMapping("/comments")
    @Operation(summary = "Lister les commentaires (public)")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getComments(
            @PathVariable Long resourceId, Authentication authentication) {

        requireResource(resourceId);
        Long me = currentUser(authentication).map(User::getId).orElse(null);

        List<Map<String, Object>> comments =
                commentRepository.findByResource_IdOrderByCreatedAtDesc(resourceId).stream()
                        .map(c -> toResponse(c, me))
                        .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(comments));
    }

    @PostMapping("/comments")
    @Operation(summary = "Publier un commentaire (compte requis)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addComment(
            @PathVariable Long resourceId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        Resource resource = requireResource(resourceId);
        User user = requireUser(authentication, "Connecte-toi pour commenter.");

        String content = body.get("content");
        if (content == null || content.isBlank()) {
            throw new BadRequestException("Le commentaire ne peut pas être vide.");
        }
        if (content.length() > MAX_COMMENT_LENGTH) {
            throw new BadRequestException(
                    "Le commentaire est trop long (max " + MAX_COMMENT_LENGTH + " caractères).");
        }

        ResourceComment saved = commentRepository.save(ResourceComment.builder()
                .resource(resource)
                .user(user)
                .content(content.trim())
                .createdAt(LocalDateTime.now())
                .build());

        return ResponseEntity.ok(ApiResponse.success(
                toResponse(saved, user.getId()), "Commentaire publié"));
    }

    /** Delete your own comment. Admins can delete anyone's — that is what moderation is. */
    @DeleteMapping("/comments/{commentId}")
    @Transactional
    @Operation(summary = "Supprimer son commentaire (ou n'importe lequel si admin)")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long resourceId,
            @PathVariable Long commentId,
            Authentication authentication) {

        User user = requireUser(authentication, "Connecte-toi pour supprimer un commentaire.");

        ResourceComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        if (!comment.getResource().getId().equals(resourceId)) {
            throw new BadRequestException("Ce commentaire n'appartient pas à cette ressource.");
        }

        boolean isAuthor = comment.getUser().getId().equals(user.getId());
        boolean isAdmin  = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAuthor && !isAdmin) {
            throw new ForbiddenException("Tu ne peux supprimer que tes propres commentaires.");
        }

        commentRepository.delete(comment);
        return ResponseEntity.ok(ApiResponse.success(null, "Commentaire supprimé"));
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private Resource requireResource(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", id));
    }

    private java.util.Optional<User> currentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return java.util.Optional.empty();
        }
        return userRepository.findByEmail(authentication.getName());
    }

    private User requireUser(Authentication authentication, String message) {
        return currentUser(authentication).orElseThrow(() -> new ForbiddenException(message));
    }

    private Map<String, Object> toResponse(ResourceComment c, Long currentUserId) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("content", c.getContent());
        m.put("createdAt", c.getCreatedAt());
        m.put("authorName", c.getUser().getUsername());
        m.put("authorPictureUrl", c.getUser().getPictureUrl());
        // Lets the client show a delete button without having to know the rules.
        m.put("mine", currentUserId != null && c.getUser().getId().equals(currentUserId));
        return m;
    }
}
