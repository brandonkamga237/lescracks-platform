package com.brandonkamga.lescracks.identity.domain;


import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

public interface UserProfileService {
    User require(String email);

    /** Lookup without failure, for callers that also serve visitors and admin accounts. */
    Optional<User> find(String email);
    User update(String email, ProfileChanges changes);

    /** Saves the welcome answers (all optional) and marks the welcome as done, answered or put off. */
    User onboard(String email, OnboardingAnswers answers);
    User updateAvatar(String email, MultipartFile file);
    void changePassword(String email, PasswordChange change);
    void delete(String email);
}
