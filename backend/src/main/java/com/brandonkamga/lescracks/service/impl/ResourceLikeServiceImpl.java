package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.domain.ResourceLike;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.ResourceLikeRepository;
import com.brandonkamga.lescracks.repository.ResourceRepository;
import com.brandonkamga.lescracks.service.interfaces.ResourceLikeService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ResourceLikeServiceImpl implements ResourceLikeService {
    private final ResourceLikeRepository likes;
    private final ResourceRepository resources;

    public ResourceLikeServiceImpl(ResourceLikeRepository likes, ResourceRepository resources) {
        this.likes = likes;
        this.resources = resources;
    }

    @Override
    @Transactional(readOnly = true)
    public long countLikes(Long resourceId) {
        return likes.countByResourceId(resourceId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasLiked(Long resourceId, String userEmail) {
        if (userEmail == null || userEmail.isBlank()) return false;
        return likes.existsByResourceIdAndUserEmail(resourceId, userEmail);
    }

    @Override
    public long like(Long resourceId, String userEmail) {
        Resource resource = resources.findById(resourceId)
                .orElseThrow(() -> new NotFoundException("Resource", "id", resourceId));
        if (likes.findByResourceIdAndUserEmail(resourceId, userEmail).isEmpty()) {
            likes.save(ResourceLike.builder().resource(resource).userEmail(userEmail).build());
        }
        return likes.countByResourceId(resourceId);
    }

    @Override
    public void unlike(Long resourceId, String userEmail) {
        likes.deleteByResourceIdAndUserEmail(resourceId, userEmail);
    }
}
