package com.brandonkamga.lescracks.identity.domain.credential;

import com.brandonkamga.lescracks.identity.domain.member.User;

public interface UserAuthService {

    /** The member behind these credentials. An unverified address still signs in: it is asked to confirm, not locked out. */
    User authenticate(Credentials credentials);
}
