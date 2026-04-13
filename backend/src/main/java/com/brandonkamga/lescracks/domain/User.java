package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Builder.Default
    private String password = null;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "provider_id", nullable = false)
    private Provider provider;

    @Column(name = "provider_user_id", length = 100)
    private String providerUserId;

    private String phone;

    private String country;

    @Column(name = "picture_url", length = 512)
    private String pictureUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, optional = true)
    private ImageAsset imageAsset;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "premium_activated_at")
    private LocalDateTime premiumActivatedAt;

    @Column(name = "premium_expires_at")
    private LocalDateTime premiumExpiresAt;

    /** Email used for premium reminders — provided by the user at request time. */
    @Column(name = "premium_contact_email", length = 255)
    private String premiumContactEmail;

    /** True once the user has clicked the verification link in their welcome email. */
    @Column(name = "email_verified", nullable = false, columnDefinition = "boolean NOT NULL DEFAULT false")
    @Builder.Default
    private boolean emailVerified = false;

    /** One-time token sent in the verification email. Cleared after use. */
    @Column(name = "verification_token", length = 100)
    private String verificationToken;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @ManyToMany
    @JoinTable(
        name = "user_tags",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();
}
