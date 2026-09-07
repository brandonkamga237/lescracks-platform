package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * An ebook resource, backed by a {@link Document}.
 *
 * The ebook is a thin join between a {@link Resource} and a {@link Document}.
 */
@Entity
@Table(name = "ebooks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ebook {

    @Id
    @Column(name = "resource_id")
    private Long resourceId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "resource_id")
    private Resource resource;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false, unique = true)
    private Document document;
}