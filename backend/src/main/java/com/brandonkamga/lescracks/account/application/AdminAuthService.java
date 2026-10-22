package com.brandonkamga.lescracks.identity.domain.admin;

public interface AdminAuthService {

    /** The active administrator behind these credentials; refuses with a 401 otherwise. */
    Admin authenticate(String username, String password);
}
