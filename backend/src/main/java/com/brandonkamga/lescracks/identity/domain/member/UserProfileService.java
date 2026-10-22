package com.brandonkamga.lescracks.identity.domain.member;

import java.util.Optional;

public interface UserProfileService {
    User require(String email);

    /** Lookup without failure, for callers that also serve visitors and admin accounts. */
    Optional<User> find(String email);
    User update(String email, ProfileChanges changes);

    /** Saves the welcome answers (all optional) and marks the welcome as done, answered or put off. */
    User onboard(String email, OnboardingAnswers answers);
    /** Replaces the photo with a JPEG, PNG or WebP of 5 MB at most, and deletes the previous one. */
    User updateAvatar(String email, String fileName, byte[] content);

    User removeAvatar(String email);
    void delete(String email);
}
