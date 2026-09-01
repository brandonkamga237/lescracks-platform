package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.domain.ResourceKind;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collection;
import java.util.Set;

/**
 * The catalogue: videos we point at, ebooks we hold, articles we wrote.
 *
 * Each kind is created through its own method rather than one that takes everything and
 * decides afterwards. A video has no body and an article has no file, so a single create
 * would need parameters that are wrong two thirds of the time.
 */
public interface ResourceService {

    Page<Resource> search(ResourceKind kind, Long categoryId, Collection<Long> tagIds,
                          String search, Pageable pageable);

    Page<Resource> all(Pageable pageable);

    Resource requireBySlug(String slug);

    Resource require(Long id);

    Resource createVideo(VideoDraft draft);

    Resource createEbook(EbookDraft draft, MultipartFile file);

    Resource createArticle(ArticleDraft draft);

    Resource updateVideo(Long id, VideoDraft draft);

    Resource updateArticle(Long id, ArticleDraft draft);

    Resource setPublished(Long id, boolean published);

    void delete(Long id);

    /** Counts a view. Fire and forget: a lost view matters less than a slowed page. */
    void recordView(Long id);

    /** What every kind carries, so the three drafts below say only what differs. */
    record Common(String title, String summary, Long categoryId, Set<Long> tagIds, Long coverId) {
    }

    record VideoDraft(Common common, String externalUrl, Integer durationSeconds) {
    }

    record EbookDraft(Common common, Integer pageCount) {
    }

    /** The body is the block document; its prose and reading time are derived, never supplied. */
    record ArticleDraft(Common common, String body, String authorName) {
    }
}
