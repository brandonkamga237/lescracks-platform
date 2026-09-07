package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.auth.*;
public interface UserAuthService {
    User register(UserRegisterRequest request);
    User authenticate(UserLoginRequest request);
    void requestPasswordReset(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}