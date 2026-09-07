package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.service.interfaces.ResourceLikeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Likes on resources. Reading the count is public; placing or removing a like requires
 * an authenticated user.
 */
@RestController
@RequestMapping("/api/resources/{resourceId}/likes")
public class ResourceLikeController {
    private final ResourceLikeService likes;

    public ResourceLikeController(ResourceLikeService likes) {
        this.likes = likes;
    }

    @GetMapping
    public LikeStatus status(@PathVariable Long resourceId, Authentication authentication) {
        String email = (authentication != null) ? authentication.getName() : null;
        return new LikeStatus(likes.countLikes(resourceId), likes.hasLiked(resourceId, email));
    }

    @PostMapping
    public ResponseEntity<LikeStatus> like(@PathVariable Long resourceId, Principal principal) {
        long count = likes.like(resourceId, principal.getName());
        return ResponseEntity.ok(new LikeStatus(count, true));
    }

    @DeleteMapping
    public ResponseEntity<LikeStatus> unlike(@PathVariable Long resourceId, Principal principal) {
        likes.unlike(resourceId, principal.getName());
        return ResponseEntity.ok(new LikeStatus(likes.countLikes(resourceId), false));
    }

    public record LikeStatus(long count, boolean liked) {
    }
}
