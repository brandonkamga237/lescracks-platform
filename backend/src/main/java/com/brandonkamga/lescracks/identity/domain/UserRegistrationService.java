package com.brandonkamga.lescracks.identity.domain;

public interface UserRegistrationService {

    /** Creates the account, or turns a newsletter-only contact with the same email into one. */
    User register(Registration registration);
}
