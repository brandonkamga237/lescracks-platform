package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.AuthProvider;

public interface OidcSyncService {

    /** The local account behind a provider token, created on first sign-in. */
    AccountSummary sync(String token, AuthProvider provider);
}
