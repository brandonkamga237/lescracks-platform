package com.brandonkamga.lescracks.member.application;

import com.brandonkamga.lescracks.account.application.AccountSummary;
import com.brandonkamga.lescracks.member.domain.model.MemberProfile;
import com.brandonkamga.lescracks.member.domain.model.ProfileCompletion;

/** A member as their own profile page and the back office see them: the account and the profile. */
public record MemberView(AccountSummary account, MemberProfile profile) {

    public ProfileCompletion completion() {
        return ProfileCompletion.of(profile);
    }
}
