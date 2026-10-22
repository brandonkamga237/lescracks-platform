package com.brandonkamga.lescracks.identity.infra.persistence;

import com.brandonkamga.lescracks.identity.domain.member.AuthProvider;
import com.brandonkamga.lescracks.identity.domain.member.MemberGoal;
import com.brandonkamga.lescracks.identity.domain.member.MemberSituation;
import com.brandonkamga.lescracks.identity.domain.member.UserStatus;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/** The users table. Named "User" so JPQL reads as it did before the domain model moved out. */
@Entity(name = "User")
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class UserEntity {

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
    private Map<String, String> socialLinks = new HashMap<>();

    @Column(name = "public_bio", nullable = false)
    private boolean publicBio;

    @Column(name = "public_location", nullable = false)
    private boolean publicLocation;

    @Column(name = "public_links", nullable = false)
    private boolean publicLinks;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuthProvider provider;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    @Column(length = 20)
    private String phone;

    @Column(length = 2)
    private String country;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private MemberSituation situation;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private MemberGoal goal;

    // Every load maps the interests into the domain model: batching keeps a list of N users at a
    // handful of queries instead of N + 1.
    @ElementCollection
    @CollectionTable(name = "user_interests", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "category_id")
    @BatchSize(size = 100)
    private Set<Long> interests = new HashSet<>();

    @Column(name = "marketing_consent", nullable = false)
    private boolean marketingConsent;

    @Column(name = "onboarded_at")
    private Instant onboardedAt;

    @Column(name = "signup_path", length = 255)
    private String signupPath;

    @Column(name = "signup_language", length = 20)
    private String signupLanguage;

    @Column(name = "signup_timezone", length = 64)
    private String signupTimezone;
}
