package com.brandonkamga.lescracks.member.api.dto;

import com.brandonkamga.lescracks.account.application.AccountSummary;
import com.brandonkamga.lescracks.account.domain.model.AccountStatus;
import com.brandonkamga.lescracks.account.domain.model.AuthProvider;
import com.brandonkamga.lescracks.member.application.MemberView;
import com.brandonkamga.lescracks.member.domain.model.MemberGoal;
import com.brandonkamga.lescracks.member.domain.model.MemberProfile;
import com.brandonkamga.lescracks.member.domain.model.MemberSituation;

import java.time.Instant;

public record MemberAdminResponse(Long id, String email, String firstName, String lastName,
                                  AccountStatus status, boolean verified, AuthProvider provider, Instant createdAt,
                                  String phone, String country, MemberSituation situation, MemberGoal goal,
                                  String location, boolean marketingConsent, int completion,
                                  boolean onboarded, Instant lastSeenAt, String signupPath) {

    public static MemberAdminResponse of(MemberView view) {
        AccountSummary account = view.account();
        MemberProfile profile = view.profile();
        return new MemberAdminResponse(account.getId(), account.getEmail(), account.getFirstName(), account.getLastName(),
                account.getStatus(), account.isEmailVerified(), account.getProvider(), account.getCreatedAt(),
                profile.getPhone(), profile.getCountry(), profile.getSituation(), profile.getGoal(),
                profile.getLocation(), profile.isMarketingConsent(), view.completion().percent(),
                profile.getOnboardedAt() != null, account.getLastSeenAt(), account.getSignupPath());
    }
}
