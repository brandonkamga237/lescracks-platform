package com.brandonkamga.lescracks.identity.domain.signup;

import com.brandonkamga.lescracks.identity.domain.member.User;

public interface UserRegistrationService {

    /** Creates the account, or turns a newsletter-only contact with the same email into one. */
    User register(Registration registration);
}
