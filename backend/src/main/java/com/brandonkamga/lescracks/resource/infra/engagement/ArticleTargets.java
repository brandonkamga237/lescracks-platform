package com.brandonkamga.lescracks.resource.infra.engagement;

import com.brandonkamga.lescracks.engagement.application.ContentTargets;
import com.brandonkamga.lescracks.engagement.application.TargetPage;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.resource.domain.Resource;
import com.brandonkamga.lescracks.resource.domain.ResourceStatus;
import com.brandonkamga.lescracks.resource.infra.ResourceRepository;

import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

/** Articles as engagement targets. Repository only: the article service reads engagement's counts. */
@Component
class ArticleTargets implements ContentTargets {

    private final ResourceRepository resources;

    ArticleTargets(ResourceRepository resources) {
        this.resources = resources;
    }

    @Override
    public TargetType type() {
        return TargetType.ARTICLE;
    }

    @Override
    public boolean isOpen(Long id) {
        return resources.findById(id).map(resource -> resource.getStatus() == ResourceStatus.PUBLISHED).orElse(false);
    }

    @Override
    public Map<Long, TargetPage> describe(Collection<Long> ids) {
        return resources.findAllById(ids).stream().collect(Collectors.toMap(Resource::getId, resource -> new TargetPage(
                resource.getId(), resource.getTitle(), "/blog/" + (resource.getSlug() == null || resource.getSlug().isBlank()
                        ? resource.getId() : resource.getSlug()))));
    }
}
