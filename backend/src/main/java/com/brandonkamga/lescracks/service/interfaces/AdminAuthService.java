package com.brandonkamga.lescracks.service.interfaces;

import org.springframework.security.core.Authentication;

public interface AdminAuthService {
    Authentication authenticate(String username, String password);
}