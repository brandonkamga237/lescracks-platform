package com.brandonkamga.lescracks.identity.domain.member;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * A person known to the platform: a member who can sign in, or a newsletter-only contact.
 * Plain Java: how it is stored is {@link UserStore}'s business.
 */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class User {

    private Long id;

    private String email;

    private String passwordHash;

    private String firstName;

    private String lastName;

    private String username;

    private String avatarUrl;

    private String bio;

    private String location;

    @Builder.Default
    private Map<String, String> socialLinks = new HashMap<>();

    /** What the public profile shows beyond name, photo and badges; all private until the member opens them. */
    private boolean publicBio;

    private boolean publicLocation;

    private boolean publicLinks;

    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    private boolean emailVerified;

    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();

    private Instant lastSeenAt;

    /** E.164 (+237…), so the country always follows from it. */
    private String phone;

    /** ISO 3166 alpha-2, derived from the phone number. */
    private String country;

    private MemberSituation situation;

    private MemberGoal goal;

    /** Category ids; ids rather than categories so identity does not reach into the taxonomy domain. */
    @Builder.Default
    private Set<Long> interests = new HashSet<>();

    private boolean marketingConsent;

    private Instant onboardedAt;

    private String signupPath;

    private String signupLanguage;

    private String signupTimezone;

    /** False for a newsletter-only contact: no password and no Google or GitHub login. */
    public boolean hasLoginMethod() {
        return passwordHash != null || provider != AuthProvider.LOCAL;
    }
}
