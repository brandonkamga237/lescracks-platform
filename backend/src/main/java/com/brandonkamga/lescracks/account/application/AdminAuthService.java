package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Admin;

public interface AdminAuthService {

    /** The active administrator behind these credentials; refuses with a 401 otherwise. */
    Admin authenticate(String username, String password);
}
