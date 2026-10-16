package com.brandonkamga.lescracks.identity.domain;

public interface EmailVerificationService {

    /** Issues a fresh link valid 24 hours and emails it. */
    void send(User user);

    void verify(String token);

    /** Silent when no account matches, so the endpoint cannot be used to probe addresses. */
    void resend(String email);
}
