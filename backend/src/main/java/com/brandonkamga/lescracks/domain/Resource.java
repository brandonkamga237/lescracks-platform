package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/**
 * An entry in the catalogue.
 *
 * Holds what every resource shares: a title, a description, a cover image, a category,
 * a status and timestamps. What each kind alone has lives in its own table —
 * {@link Ebook}, {@link ExternalVideoReference} — linked by a
 * one-to-one primary key join.
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

    @Column(length = 220)
    private String slug;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "cover_image", nullable = false, length = 500)
    private String coverImage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ResourceStatus status = ResourceStatus.DRAFT;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "resource_tags",
            joinColumns = @JoinColumn(name = "resource_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();
}