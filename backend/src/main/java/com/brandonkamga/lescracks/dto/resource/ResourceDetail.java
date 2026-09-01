package com.brandonkamga.lescracks.dto.resource;

import com.brandonkamga.lescracks.domain.ResourceKind;
import com.brandonkamga.lescracks.dto.media.MediaResponse;
import com.brandonkamga.lescracks.dto.taxonomy.TagResponse;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.List;

/**
 * One resource, in full.
 *
 * The shape follows the model: what every resource is, then one nested part for whichever
 * kind this turns out to be. Only that part is present, so a video answers with a `video`
 * object and no mention of a body or a download — rather than twenty fields where fourteen
 * are null and the caller has to know which ones matter.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ResourceDetail(
        Long id,
        String slug,
        ResourceKind kind,
        String title,
        String summary,
        MediaResponse cover,
        Long categoryId,
        String categoryName,
        List<TagResponse> tags,
        long viewCount,
        boolean published,
        Instant createdAt,

        Video video,
        Ebook ebook,
        Article article) {

    /** A video is a reference to somewhere else; the duration is shown before the click. */
    public record Video(String externalUrl, Integer durationSeconds) {
    }

    /** An ebook is a file to take away; the size is told before the download starts. */
    public record Ebook(String downloadUrl, String originalName, long sizeBytes, Integer pageCount) {
    }

    /** An article is the document itself, sent as JSON so no client parses it twice. */
    public record Article(JsonNode body, String authorName, Integer readingMinutes) {
    }
}
