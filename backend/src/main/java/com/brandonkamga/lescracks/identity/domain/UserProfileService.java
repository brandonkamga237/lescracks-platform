package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.api.dto.UserPasswordChangeRequest;
import com.brandonkamga.lescracks.identity.api.dto.UserProfileUpdateRequest;

import org.springframework.web.multipart.MultipartFile;

public interface UserProfileService {
    User require(String email);
    User update(String email, UserProfileUpdateRequest request);
    User updateAvatar(String email, MultipartFile file);
    void changePassword(String email, UserPasswordChangeRequest request);
    void delete(String email);
}
