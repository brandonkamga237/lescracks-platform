package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/**
 * A video reference, an uploaded ebook, or an article written here.
 *
 * Exactly one of {@code externalUrl}, {@code fileKey} and {@code body} carries the substance,
 * decided by {@code kind}. A check constraint enforces the pairing in the database, so an
 * article with a YouTube link — which the old model allowed — cannot be stored.
 */
@Entity
@Table(name = "resources")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 160)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 500)
    private String summary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ResourceKind kind;

    /** VIDEO only: where to watch it. */
    @Column(name = "external_url", length = 1000)
    private String externalUrl;

    /** EBOOK only: the object key in storage. */
    @Column(name = "file_key", length = 255)
    private String fileKey;

    /**
     * ARTICLE only: the document, as an array of typed blocks — paragraph, heading, image,
     * quote, code. Held as JSON so the editor can offer tools over structure, and so the
     * rendering can change without rewriting what was written.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String body;

    /**
     * The same article flattened to prose. Written by the service whenever the body is, never
     * by hand: search and the SEO snapshot need text, and walking a block tree for either
     * would be absurd.
     */
    @Column(name = "body_text", columnDefinition = "TEXT")
    private String bodyText;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cover_id")
    private Media cover;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "author_name", length = 120)
    private String authorName;

    @Column(name = "reading_minutes")
    private Integer readingMinutes;

    /** How many times it was opened. Shown publicly: readers use it to judge what is worth their time. */
    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private long viewCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean published = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "resource_tags",
            joinColumns = @JoinColumn(name = "resource_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    @OneToOne(mappedBy = "resource", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ResourceFile file;

    /**
     * The images this resource actually shows. Kept in step when the body is saved, so an
     * image in a published article cannot be deleted and orphans are a join away.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "resource_media",
            joinColumns = @JoinColumn(name = "resource_id"),
            inverseJoinColumns = @JoinColumn(name = "media_id"))
    @Builder.Default
    private Set<Media> media = new HashSet<>();

    /** Only an ebook is a download; the other two are read or watched where they are. */
    public boolean isDownloadable() {
        return kind == ResourceKind.EBOOK;
    }
}
