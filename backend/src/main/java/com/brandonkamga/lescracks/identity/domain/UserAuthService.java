package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.api.dto.ForgotPasswordRequest;
import com.brandonkamga.lescracks.identity.api.dto.ResetPasswordRequest;
import com.brandonkamga.lescracks.identity.api.dto.UserLoginRequest;
import com.brandonkamga.lescracks.identity.api.dto.UserRegisterRequest;

public interface UserAuthService {
    User register(UserRegisterRequest request);
    User authenticate(UserLoginRequest request);
    void verifyEmail(String token);
    void resendVerificationEmail(String email);
    void requestPasswordReset(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}
