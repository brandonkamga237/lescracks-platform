package com.brandonkamga.lescracks.identity.domain.signup;

import com.brandonkamga.lescracks.identity.domain.member.User;

public interface EmailVerificationService {

    /** Issues a fresh link valid 24 hours and emails it. */
    void send(User user);

    void verify(String token);

    /** For a signed-in member asking again; says why when nothing is sent (already confirmed, just sent). */
    void sendAgain(String email);

    /**
     * For the public form: silent when no account matches, when the address is already confirmed
     * or a link left less than a minute ago, so it can neither probe addresses nor flood a mailbox.
     */
    void resend(String email);
}
