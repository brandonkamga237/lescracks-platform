package com.brandonkamga.lescracks.account.application;

/** What a signed-in member changes about their own account. */
public interface AccountSettingsService {

    /** The current password is checked first. */
    void changePassword(String email, PasswordChange change);

    /** Deletes the account; everything that belongs to it goes with it. */
    void close(String email);
}
