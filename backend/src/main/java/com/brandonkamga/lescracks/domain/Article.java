package com.brandonkamga.lescracks.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * An inline article resource, stored as a block document.
 */
@Entity
@Table(name = "articles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Article {

    @Id
    @Column(name = "resource_id")
    private Long resourceId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "resource_id")
    private Resource resource;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private JsonNode body;

    @Column(name = "plain_text", columnDefinition = "text")
    private String plainText;

    @Column(name = "reading_minutes", nullable = false)
    @Builder.Default
    private int readingMinutes = 1;
}
