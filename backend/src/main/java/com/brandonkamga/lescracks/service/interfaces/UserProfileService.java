package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.user.UserPasswordChangeRequest;
import com.brandonkamga.lescracks.dto.user.UserProfileUpdateRequest;

public interface UserProfileService {
    User require(String email);
    User update(String email, UserProfileUpdateRequest request);
    void changePassword(String email, UserPasswordChangeRequest request);
    void delete(String email);
}
