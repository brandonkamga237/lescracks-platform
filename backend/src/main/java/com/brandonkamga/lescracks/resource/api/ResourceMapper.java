package com.brandonkamga.lescracks.resource.api;

import com.brandonkamga.lescracks.engagement.application.EngagementCounts;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.resource.api.dto.ResourceResponse;
import com.brandonkamga.lescracks.resource.domain.Resource;
import com.brandonkamga.lescracks.resource.domain.ResourceService;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class ResourceMapper {
    private final ResourceService resources;
    private final EngagementCounts engagement;

    public ResourceMapper(ResourceService resources, EngagementCounts engagement) {
        this.resources = resources;
        this.engagement = engagement;
    }

    public ResourceResponse toResponse(Resource resource) {
        return build(resource, true, engagement.countsOf(Target.article(resource.getId())));
    }

    /** For a list: the counts of the whole page in one query. */
    public Function<Resource, ResourceResponse> responses(Collection<Resource> page) {
        Map<Long, Counts> counts = countsOf(page);
        return resource -> build(resource, true, counts.get(resource.getId()));
    }

    /** For cards: without the body, which weighs tens of kilobytes per article; counts in one query. */
    public Function<Resource, ResourceResponse> summaries(Collection<Resource> page) {
        Map<Long, Counts> counts = countsOf(page);
        return resource -> build(resource, false, counts.get(resource.getId()));
    }

    private Map<Long, Counts> countsOf(Collection<Resource> page) {
        return engagement.countsOf(TargetType.ARTICLE, page.stream().map(Resource::getId).toList());
    }

    private ResourceResponse build(Resource resource, boolean withBody, Counts counts) {
        var article = resources.article(resource.getId()).orElse(null);
        JsonNode body = withBody && article != null ? article.getBody() : null;
        Integer readingMinutes = article != null ? article.getReadingMinutes() : null;
        Counts figures = counts == null ? Counts.NONE : counts;
        return new ResourceResponse(
                resource.getId(), resource.getSlug(), resource.getTitle(), resource.getDescription(), resource.getCoverImage(),
                resource.getStatus(), resource.getCategory().getId(), resource.getCategory().getName(),
                resource.getTags().stream().map(tag -> tag.getName()).collect(Collectors.toSet()),
                (long) figures.likes(), figures.views(),
                resource.getCreatedAt(), resource.getUpdatedAt(),
                body, readingMinutes, resource.getScheduledAt(), resource.getPublishedAt());
    }
}
