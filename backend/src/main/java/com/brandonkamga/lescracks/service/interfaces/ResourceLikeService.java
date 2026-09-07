package com.brandonkamga.lescracks.service.interfaces;

public interface ResourceLikeService {
    long countLikes(Long resourceId);
    boolean hasLiked(Long resourceId, String userEmail);
    long like(Long resourceId, String userEmail);
    void unlike(Long resourceId, String userEmail);
}
