package com.brandonkamga.lescracks.member.application;

/** The signed-in member's own profile. */
public interface ProfileService {

    MemberView view(String email);

    MemberView update(String email, ProfileChanges changes);

    /** Saves the welcome answers (all optional) and marks the welcome as done, answered or put off. */
    MemberView onboard(String email, OnboardingAnswers answers);

    /** Replaces the photo with a JPEG, PNG or WebP of 5 MB at most, and deletes the previous one. */
    MemberView updateAvatar(String email, String fileName, byte[] content);

    MemberView removeAvatar(String email);

    /** What the sign-up form asked beyond the account: a wrong number refuses the whole sign-up. */
    void recordSignUp(Long accountId, String phone, Boolean marketingConsent);
}
