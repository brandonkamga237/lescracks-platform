package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String url;

    /** Whether this resource requires a premium subscription to access. */
    @Column(name = "is_premium", nullable = false)
    @Builder.Default
    private boolean premium = false;

    /** Whether users are allowed to download this resource. */
    @Column(name = "is_downloadable", nullable = false)
    @Builder.Default
    private boolean downloadable = true;

    /** EXTERNAL (YouTube / external URL) or UPLOADED (stored on platform). */
    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    @Builder.Default
    private ResourceSourceType sourceType = ResourceSourceType.EXTERNAL;

    /** Cumulative view count — incremented atomically on each access. */
    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private long viewCount = 0;

    /** Cumulative download count — incremented atomically on each download. */
    @Column(name = "download_count", nullable = false)
    @Builder.Default
    private long downloadCount = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_type_id", nullable = false)
    private ResourceType resourceType;

    @OneToOne(mappedBy = "resource", cascade = CascadeType.ALL, fetch = FetchType.LAZY, optional = true)
    private ResourceMetadata metadata;

    @Column(name = "preview_image_url")
    private String previewImageUrl;

    @ManyToMany
    @JoinTable(
        name = "resource_tags",
        joinColumns = @JoinColumn(name = "resource_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();
}
