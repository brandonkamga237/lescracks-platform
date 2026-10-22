package com.brandonkamga.lescracks.content.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * One episode of LesCracks Talk: a conversation hosted on YouTube. The thumbnail is derived from
 * the URL unless the admin uploads a cover, which then wins everywhere.
 */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class Talk {

    private Long id;

    private String title;

    private String description;

    /** The person interviewed, when there is one. */
    private String guest;

    private String youtubeUrl;

    /** Uploaded cover (/api/files/…); null means the YouTube thumbnail is shown. */
    private String coverImage;

    private Integer durationMinutes;

    private Instant publishedAt;

    @Builder.Default
    private TalkStatus status = TalkStatus.DRAFT;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();

    public boolean isPublished() {
        return status == TalkStatus.PUBLISHED;
    }
}
