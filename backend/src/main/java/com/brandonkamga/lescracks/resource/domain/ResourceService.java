package com.brandonkamga.lescracks.resource.domain;

import com.brandonkamga.lescracks.shared.scheduling.ScheduledPublishing;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ResourceService extends ScheduledPublishing {
    List<Resource> published();
    Page<Resource> search(ResourceStatus status, String search, Long categoryId, Long tagId, Pageable pageable);
    Resource requirePublished(Long id);
    Resource require(Long id);
    Resource requirePublishedBySlugOrId(String slugOrId);
    Resource requireBySlugOrId(String slugOrId);
    Resource createArticle(ArticleContent content, MultipartFile coverImageFile);
    Resource updateArticle(Long id, ArticleContent content, MultipartFile coverImageFile);
    Page<Resource> all(Pageable pageable);

    /** The body of an article, absent for a resource saved before its body. */
    Optional<Article> article(Long resourceId);
    void delete(Long id);
}
