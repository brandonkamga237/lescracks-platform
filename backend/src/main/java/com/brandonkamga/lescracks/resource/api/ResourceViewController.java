package com.brandonkamga.lescracks.resource.api;

import com.brandonkamga.lescracks.resource.api.dto.ResourceViewRequest;
import com.brandonkamga.lescracks.resource.domain.ResourceViewService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/** Public: an article counts its readers whether or not they have an account. */
@RestController
@RequestMapping("/api/resources/{resourceId}/views")
public class ResourceViewController {
    private final ResourceViewService views;

    public ResourceViewController(ResourceViewService views) {
        this.views = views;
    }

    @PostMapping
    public ViewCount record(@PathVariable Long resourceId, @RequestBody(required = false) ResourceViewRequest request,
                            Authentication authentication) {
        var body = request != null ? request : new ResourceViewRequest(null);
        return new ViewCount(views.recordView(resourceId, body.toVisitorKey(authentication != null ? authentication.getName() : null)));
    }

    public record ViewCount(int viewCount) {
    }
}
