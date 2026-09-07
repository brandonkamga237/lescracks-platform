package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A file the platform holds, whatever its format.
 *
 * The file itself lives in object storage; what is kept here is the key to find it,
 * its format and its size.
 */
@Entity
@Table(name = "documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String file;

    @Column(nullable = false, length = 20)
    private String format;

    @Column(name = "file_size", nullable = false)
    private long fileSize;
}