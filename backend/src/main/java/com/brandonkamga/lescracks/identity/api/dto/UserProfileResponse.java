package com.brandonkamga.lescracks.identity.api.dto;

import com.brandonkamga.lescracks.identity.domain.AuthProvider;
import com.brandonkamga.lescracks.identity.domain.MemberGoal;
import com.brandonkamga.lescracks.identity.domain.MemberSituation;
import com.brandonkamga.lescracks.identity.domain.ProfileCompletion;
import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.domain.UserStatus;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * `onboardingRequired`: the welcome questions have been neither answered nor put off yet.
 * `missing`: what the completion gauge still waits for (PHONE, SITUATION, INTERESTS, GOAL, CITY, AVATAR, BIO).
 */
public record UserProfileResponse(Long id, String email, String firstName, String lastName,
                                  UserStatus status, boolean verified, AuthProvider provider, Instant createdAt,
                                  String username, String avatarUrl, String bio, String location,
                                  Map<String, String> socialLinks, List<UserIdentityResponse> identities,
                                  String phone, String country, MemberSituation situation, MemberGoal goal,
                                  Set<Long> interestIds, boolean marketingConsent,
                                  boolean onboardingRequired, int completion, List<String> missing) {

    public static UserProfileResponse of(User user, List<UserIdentityResponse> identities) {
        ProfileCompletion completion = ProfileCompletion.of(user);
        return new UserProfileResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(),
                user.getStatus(), user.isEmailVerified(), user.getProvider(), user.getCreatedAt(),
                user.getUsername(), user.getAvatarUrl(), user.getBio(), user.getLocation(), user.getSocialLinks(), identities,
                user.getPhone(), user.getCountry(), user.getSituation(), user.getGoal(),
                Set.copyOf(user.getInterests()), user.isMarketingConsent(),
                user.getOnboardedAt() == null, completion.percent(), completion.missing());
    }
}
