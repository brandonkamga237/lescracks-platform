package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * A like placed by a signed-in user on a resource.
 *
 * One like per user and per resource. The user identifier is the email returned by the
 * authentication provider; both local and OIDC users therefore use the same stable value.
 */
@Entity
@Table(name = "resource_likes", uniqueConstraints = @UniqueConstraint(columnNames = {"resource_id", "user_email"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    @Column(name = "user_email", nullable = false, length = 120)
    private String userEmail;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
