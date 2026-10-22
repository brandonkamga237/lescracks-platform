package com.brandonkamga.lescracks.member.api.dto;

import com.brandonkamga.lescracks.account.api.dto.IdentityResponse;
import com.brandonkamga.lescracks.account.application.AccountSummary;
import com.brandonkamga.lescracks.account.domain.model.AccountStatus;
import com.brandonkamga.lescracks.account.domain.model.AuthProvider;
import com.brandonkamga.lescracks.account.domain.model.ExternalIdentity;
import com.brandonkamga.lescracks.member.application.MemberView;
import com.brandonkamga.lescracks.member.domain.model.MemberGoal;
import com.brandonkamga.lescracks.member.domain.model.MemberProfile;
import com.brandonkamga.lescracks.member.domain.model.MemberSituation;
import com.brandonkamga.lescracks.member.domain.model.ProfileCompletion;
import com.brandonkamga.lescracks.storage.domain.StoredFiles;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * `onboardingRequired`: the welcome questions have been neither answered nor put off yet.
 * `missing`: what the completion gauge still waits for (PHONE, SITUATION, INTERESTS, GOAL, CITY, AVATAR, BIO).
 */
public record ProfileResponse(Long id, String email, String firstName, String lastName,
                              AccountStatus status, boolean verified, AuthProvider provider, Instant createdAt,
                              String username, String avatarUrl, String bio, String location,
                              Map<String, String> socialLinks, List<IdentityResponse> identities,
                              String phone, String country, MemberSituation situation, MemberGoal goal,
                              Set<Long> interestIds, boolean marketingConsent,
                              boolean onboardingRequired, int completion, List<String> missing,
                              boolean publicBio, boolean publicLocation, boolean publicLinks) {

    public static ProfileResponse of(MemberView view, List<ExternalIdentity> identities) {
        AccountSummary account = view.account();
        MemberProfile profile = view.profile();
        ProfileCompletion completion = view.completion();
        return new ProfileResponse(account.getId(), account.getEmail(), account.getFirstName(), account.getLastName(),
                account.getStatus(), account.isEmailVerified(), account.getProvider(), account.getCreatedAt(),
                profile.getUsername(), StoredFiles.publicPath(profile.getAvatarUrl()), profile.getBio(), profile.getLocation(),
                profile.getSocialLinks(), identities.stream().map(IdentityResponse::of).toList(),
                profile.getPhone(), profile.getCountry(), profile.getSituation(), profile.getGoal(),
                Set.copyOf(profile.getInterests()), profile.isMarketingConsent(),
                profile.getOnboardedAt() == null, completion.percent(), completion.missing(),
                profile.isPublicBio(), profile.isPublicLocation(), profile.isPublicLinks());
    }
}
