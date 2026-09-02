package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

/**
 * An entry in the catalogue, whatever it turns out to be.
 *
 * This holds only what a video, an ebook and an article genuinely share: a title, a place in
 * the catalogue, a cover, a count of how often it was opened. What each kind alone has lives
 * in its own table — {@link ResourceVideo}, {@link ResourceEbook}, {@link ResourceArticle} —
 * so no row carries a column that means nothing to it.
 *
 * Joined inheritance rather than one wide table: the three are browsed together and filtered
 * by kind, so they need a shared identity, but they are not the same shape.
 */
@Entity
@Table(name = "resources")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "kind", discriminatorType = DiscriminatorType.STRING, length = 20)
@Getter
@Setter
@NoArgsConstructor
public abstract class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The discriminator, mapped read-only so the catalogue filters on it in one query:
     * a Java method is invisible to HQL. Hibernate still writes the column from the entity
     * type, and the constructor sets the field so an instance answers before it is saved.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "kind", insertable = false, updatable = false, nullable = false, length = 20)
    @Setter(AccessLevel.NONE)
    private ResourceKind kind;

    @Column(nullable = false, unique = true, length = 160)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 500)
    private String summary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cover_id")
    private Media cover;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    /**
     * How many times it was opened. Shown publicly on purpose: with no likes and no comments,
     * this is the only signal a reader has about whether something was worth other people's
     * time.
     */
    @Column(name = "view_count", nullable = false)
    private long viewCount = 0;

    @Column(nullable = false)
    private boolean published = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "resource_tags",
            joinColumns = @JoinColumn(name = "resource_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private Set<Tag> tags = new HashSet<>();

    /**
     * The images this resource shows, kept in step whenever its content is saved. The link
     * exists so an image inside a published article cannot be deleted from under it, and so
     * images nothing references can be found.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "resource_media",
            joinColumns = @JoinColumn(name = "resource_id"),
            inverseJoinColumns = @JoinColumn(name = "media_id"))
    private Set<Media> media = new HashSet<>();

    protected Resource(ResourceKind kind) {
        this.kind = kind;
    }

    /** Only an ebook is a file to take away; the other two are watched or read where they are. */
    public boolean isDownloadable() {
        return kind == ResourceKind.EBOOK;
    }

    // Identity is the database id alone. Lombok's generated equality would walk the whole
    // hierarchy and the lazy associations with it.
    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof Resource resource)) return false;
        return id != null && id.equals(resource.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(getClass().getSimpleName());
    }
}
