package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * An article written on the platform.
 *
 * The body is a document of typed blocks — paragraph, heading, image with its caption,
 * quote, code — held as JSON rather than as a string of markup. Two reasons, both practical.
 * An editor offers tools over structure: you cannot drag an image into the middle of a
 * string. And the rendering can change years from now without rewriting what was written,
 * because the text was never entangled with how it looked.
 */
@Entity
@Table(name = "resource_articles")
@DiscriminatorValue("ARTICLE")
@PrimaryKeyJoinColumn(name = "resource_id")
@Getter
@Setter
@NoArgsConstructor
public class ResourceArticle extends Resource {

    /** The block document. Images inside it point at {@link Media} rows by id. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String body;

    /**
     * The same article flattened to prose, written whenever the body is and never by hand.
     * Search needs words and the SEO snapshot needs a paragraph; walking the block tree on
     * every request to produce either would be absurd.
     */
    @Column(name = "body_text", nullable = false, columnDefinition = "TEXT")
    private String bodyText;

    /** Who wrote it, which is not always whoever holds the admin account. */
    @Column(name = "author_name", length = 120)
    private String authorName;

    /** An estimate, so a reader knows what they are committing to. Null when not computed. */
    @Column(name = "reading_minutes")
    private Integer readingMinutes;

    @Override
    public ResourceKind kind() {
        return ResourceKind.ARTICLE;
    }
}
