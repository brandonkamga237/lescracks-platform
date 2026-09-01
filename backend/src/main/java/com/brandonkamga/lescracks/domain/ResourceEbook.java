package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A document the platform holds: PDF, EPUB, Word and the like.
 *
 * The file itself lives in object storage; what is kept here is the key to find it and
 * enough about it to describe the download honestly before someone starts it.
 */
@Entity
@Table(name = "resource_ebooks")
@DiscriminatorValue("EBOOK")
@PrimaryKeyJoinColumn(name = "resource_id")
@Getter
@Setter
@NoArgsConstructor
public class ResourceEbook extends Resource {

    /** The object key in storage. Never a URL: a URL would pin the file to today's host. */
    @Column(name = "file_key", nullable = false, length = 255)
    private String fileKey;

    /** What it was called when it was uploaded, which is what it should be called on the way out. */
    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "content_type", nullable = false, length = 120)
    private String contentType;

    /** Told before the download starts, not discovered halfway through it. */
    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "page_count")
    private Integer pageCount;

    @Override
    public ResourceKind kind() {
        return ResourceKind.EBOOK;
    }
}
