package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * One person liking one resource.
 *
 * There is no like counter on Resource: the count is COUNT(*) here. A denormalised
 * counter drifts the moment one write lands and the other doesn't, and then nobody
 * can say which number is true.
 *
 * The (resource, user) pair is UNIQUE in the database, so a double-click that fires
 * two requests cannot create two likes.
 */
@Entity
@Table(
    name = "resource_likes",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_resource_likes_user_resource",
        columnNames = {"resource_id", "user_id"}
    )
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ResourceLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
