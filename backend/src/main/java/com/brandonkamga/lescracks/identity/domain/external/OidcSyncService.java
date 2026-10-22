package com.brandonkamga.lescracks.identity.domain.external;

import com.brandonkamga.lescracks.identity.domain.member.AuthProvider;
import com.brandonkamga.lescracks.identity.domain.member.User;

public interface OidcSyncService {

    /** The local account behind a provider token, created on first sign-in. */
    User sync(String token, AuthProvider provider);
}
