package com.brandonkamga.lescracks.identity.domain;

import org.springframework.security.core.Authentication;

public interface AdminAuthService {
    Authentication authenticate(String username, String password);
}