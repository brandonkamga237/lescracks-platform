package com.brandonkamga.lescracks.resource.domain;

import com.brandonkamga.lescracks.resource.infra.ResourceRepository;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ResourceViewServiceImpl implements ResourceViewService {
    private final ResourceRepository resources;

    public ResourceViewServiceImpl(ResourceRepository resources) {
        this.resources = resources;
    }

    @Override
    public int recordView(Long resourceId, String visitorKey) {
        resources.findById(resourceId)
                .filter(resource -> resource.getStatus() == ResourceStatus.PUBLISHED)
                .orElseThrow(() -> new NotFoundException("Resource", "id", resourceId));
        if (resources.insertView(resourceId, visitorKey) == 1) resources.incrementViews(resourceId);
        return resources.viewCount(resourceId);
    }
}
