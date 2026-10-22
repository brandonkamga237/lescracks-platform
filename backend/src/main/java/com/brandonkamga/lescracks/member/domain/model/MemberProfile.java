package com.brandonkamga.lescracks.member.domain.model;

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
 * What a member tells about themselves: public profile, welcome answers, consent. Keyed by the
 * account id; a member who never filled anything has an empty profile, not a missing one.
 */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class MemberProfile {

    private Long accountId;

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

    /** E.164 (+237…), so the country always follows from it. */
    private String phone;

    /** ISO 3166 alpha-2, derived from the phone number. */
    private String country;

    private MemberSituation situation;

    private MemberGoal goal;

    /** Category ids; ids rather than categories so the profile does not reach into taxonomy. */
    @Builder.Default
    private Set<Long> interests = new HashSet<>();

    private boolean marketingConsent;

    private Instant onboardedAt;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();

    public static MemberProfile empty(Long accountId) {
        return MemberProfile.builder().accountId(accountId).build();
    }

    /** Null leaves the number alone, blank removes it; a number brings its country with it. */
    public void changePhone(String raw) {
        if (raw == null) return;
        if (raw.isBlank()) {
            phone = null;
            country = null;
            return;
        }
        PhoneNumbers.Parsed parsed = PhoneNumbers.parse(raw);
        phone = parsed.e164();
        country = parsed.country();
    }

    /** The welcome questions are never shown again once answered or put off. */
    public void markOnboarded() {
        if (onboardedAt == null) onboardedAt = Instant.now();
    }
}
