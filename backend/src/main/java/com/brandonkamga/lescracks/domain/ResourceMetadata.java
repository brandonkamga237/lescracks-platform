package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "resource_metadata")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceMetadata {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id", nullable = false, unique = true)
    private Resource resource;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type")
    private String mimeType;

    /** Original file name as uploaded by the admin. */
    @Column(name = "original_file_name")
    private String originalFileName;

    /** Internal storage path (relative to upload root or MinIO object key). */
    @Column(name = "storage_path")
    private String storagePath;

    /** Duration in seconds — relevant for uploaded video files. */
    @Column(name = "duration_seconds")
    private Integer durationSeconds;
}
