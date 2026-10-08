package com.brandonkamga.lescracks.identity.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * A registered user of the platform.
 *
 * Unlike the previous Keycloak-linked model, the user now holds a local password hash
 * and a status. Identity is fully managed here.
 */
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 120)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 120)
    private String lastName;

    @Column(unique = true, length = 50)
    private String username;

    @Column(name = "avatar_url", length = 255)
    private String avatarUrl;

    @Column(columnDefinition = "text")
    private String bio;

    @Column(length = 100)
    private String location;

    @Column(name = "social_links", nullable = false)
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private Map<String, String> socialLinks = new HashMap<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    /** E.164 (+237…), so the country always follows from it. */
    @Column(length = 20)
    private String phone;

    /** ISO 3166 alpha-2, derived from the phone number. */
    @Column(length = 2)
    private String country;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private MemberSituation situation;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private MemberGoal goal;

    /** Category ids; ids rather than entities so identity does not reach into the taxonomy domain. */
    // Lazy: every authenticated request loads the user, and only profile screens read the interests.
    @ElementCollection
    @CollectionTable(name = "user_interests", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "category_id")
    @Builder.Default
    private Set<Long> interests = new HashSet<>();

    @Column(name = "marketing_consent", nullable = false)
    @Builder.Default
    private boolean marketingConsent = false;

    @Column(name = "onboarded_at")
    private Instant onboardedAt;

    @Column(name = "signup_path", length = 255)
    private String signupPath;

    @Column(name = "signup_language", length = 20)
    private String signupLanguage;

    @Column(name = "signup_timezone", length = 64)
    private String signupTimezone;
}