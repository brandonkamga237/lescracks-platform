package com.brandonkamga.lescracks.identity.domain;

import org.springframework.security.oauth2.jwt.Jwt;

public interface OidcSyncService {
    User sync(Jwt jwt, AuthProvider provider);
}
