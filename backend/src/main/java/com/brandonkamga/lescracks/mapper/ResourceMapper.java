package com.brandonkamga.lescracks.mapper;

import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.domain.ResourceArticle;
import com.brandonkamga.lescracks.domain.ResourceEbook;
import com.brandonkamga.lescracks.domain.ResourceVideo;
import com.brandonkamga.lescracks.dto.resource.ResourceDetail;
import com.brandonkamga.lescracks.dto.resource.ResourceSummary;
import com.brandonkamga.lescracks.dto.taxonomy.TagResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
public class ResourceMapper {

    private static final Logger log = LoggerFactory.getLogger(ResourceMapper.class);

    private final MediaMapper mediaMapper;
    private final TaxonomyMapper taxonomyMapper;
    private final ObjectMapper json;
    private final String downloadBaseUrl;

    public ResourceMapper(MediaMapper mediaMapper, TaxonomyMapper taxonomyMapper, ObjectMapper json,
                          @Value("${app.downloads.base-url:/api/resources/download}") String downloadBaseUrl) {
        this.mediaMapper = mediaMapper;
        this.taxonomyMapper = taxonomyMapper;
        this.json = json;
        this.downloadBaseUrl = downloadBaseUrl;
    }

    public ResourceSummary toSummary(Resource resource) {
        return new ResourceSummary(
                resource.getId(), resource.getSlug(), resource.kind(), resource.getTitle(),
                resource.getSummary(), mediaMapper.toResponse(resource.getCover()),
                resource.getCategory().getName(), tagsOf(resource),
                resource.getViewCount(), resource.isPublished(), resource.getCreatedAt());
    }

    public ResourceDetail toDetail(Resource resource) {
        return new ResourceDetail(
                resource.getId(), resource.getSlug(), resource.kind(), resource.getTitle(),
                resource.getSummary(), mediaMapper.toResponse(resource.getCover()),
                resource.getCategory().getId(), resource.getCategory().getName(), tagsOf(resource),
                resource.getViewCount(), resource.isPublished(), resource.getCreatedAt(),
                videoPart(resource), ebookPart(resource), articlePart(resource));
    }

    /** Each part answers for its own kind and null for the other two, which JSON then drops. */
    private ResourceDetail.Video videoPart(Resource resource) {
        return resource instanceof ResourceVideo video
                ? new ResourceDetail.Video(video.getExternalUrl(), video.getDurationSeconds())
                : null;
    }

    private ResourceDetail.Ebook ebookPart(Resource resource) {
        return resource instanceof ResourceEbook ebook
                ? new ResourceDetail.Ebook(downloadBaseUrl + "/" + ebook.getId(),
                        ebook.getOriginalName(), ebook.getSizeBytes(), ebook.getPageCount())
                : null;
    }

    private ResourceDetail.Article articlePart(Resource resource) {
        return resource instanceof ResourceArticle article
                ? new ResourceDetail.Article(parseBody(article), article.getAuthorName(),
                        article.getReadingMinutes())
                : null;
    }

    private List<TagResponse> tagsOf(Resource resource) {
        return resource.getTags().stream()
                .sorted(Comparator.comparing(tag -> tag.getName().toLowerCase()))
                .map(taxonomyMapper::toResponse)
                .toList();
    }

    /**
     * A body that will not parse is a stored-data fault, not a request fault. It is logged and
     * the article still renders without it, rather than taking down a page a reader asked for.
     */
    private JsonNode parseBody(ResourceArticle article) {
        try {
            return json.readTree(article.getBody());
        } catch (Exception malformed) {
            log.error("Article {} has an unreadable body", article.getId(), malformed);
            return null;
        }
    }
}
