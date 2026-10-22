package com.brandonkamga.lescracks.identity.domain.credential;

public interface PasswordResetService {

    /** Silent when no account matches or the account has no password, like {@link com.brandonkamga.lescracks.identity.domain.signup.EmailVerificationService#resend}. */
    void request(String email);

    void reset(String token, String newPassword);
}
