package com.brandonkamga.lescracks.identity.domain.credential;

public interface PasswordService {

    /** A signed-in member replacing a password they know; the current one is checked first. */
    void change(String email, PasswordChange change);
}
