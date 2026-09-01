package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * What is known about an uploaded ebook. Its own table because it applies to one kind out of
 * three, and four columns null across two thirds of the catalogue is not a model.
 */
@Entity
@Table(name = "resource_files")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceFile {

    @Id
    @Column(name = "resource_id")
    private Long resourceId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "resource_id")
    private Resource resource;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "content_type", nullable = false, length = 120)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;
}
