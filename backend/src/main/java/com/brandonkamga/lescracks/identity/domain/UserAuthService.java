package com.brandonkamga.lescracks.identity.domain;

public interface UserAuthService {

    /** The member behind these credentials, if the password matches and the address is verified. */
    User authenticate(Credentials credentials);
}
