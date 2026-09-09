package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.AuthProvider;
import com.brandonkamga.lescracks.domain.User;
import org.springframework.security.oauth2.jwt.Jwt;

public interface OidcSyncService {
    User sync(Jwt jwt, AuthProvider provider);
}
