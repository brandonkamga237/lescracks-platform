package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.api.dto.OnboardingRequest;
import com.brandonkamga.lescracks.identity.api.dto.UserPasswordChangeRequest;
import com.brandonkamga.lescracks.identity.api.dto.UserProfileUpdateRequest;

import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

public interface UserProfileService {
    User require(String email);

    /** Lookup without failure, for callers that also serve visitors and admin accounts. */
    Optional<User> find(String email);
    User update(String email, UserProfileUpdateRequest request);

    /** Saves the welcome answers (all optional) and marks the welcome as done, answered or put off. */
    User onboard(String email, OnboardingRequest request);
    User updateAvatar(String email, MultipartFile file);
    void changePassword(String email, UserPasswordChangeRequest request);
    void delete(String email);
}
