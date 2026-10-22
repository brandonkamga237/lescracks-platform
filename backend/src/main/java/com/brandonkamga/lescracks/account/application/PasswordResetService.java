package com.brandonkamga.lescracks.account.application;

public interface PasswordResetService {

    /** Silent when no account matches or the account has no password, like {@link EmailVerificationService#resend}. */
    void request(String email);

    void reset(String token, String newPassword);
}
