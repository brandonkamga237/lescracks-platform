package com.brandonkamga.lescracks.talk.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * One episode of LesCracks Talk: a conversation hosted on YouTube.
 *
 * The platform only references the video — the file lives on YouTube. The thumbnail is
 * derived from the URL unless the admin uploads a cover, which then wins everywhere.
 */
@Entity
@Table(name = "talk_videos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TalkVideo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    /** The person interviewed, when there is one. */
    @Column(length = 160)
    private String guest;

    @Column(name = "youtube_url", nullable = false, length = 1000)
    private String youtubeUrl;

    /** Uploaded cover (/api/files/…); null means the YouTube thumbnail is shown. */
    @Column(name = "cover_image", length = 1000)
    private String coverImage;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TalkStatus status = TalkStatus.DRAFT;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
