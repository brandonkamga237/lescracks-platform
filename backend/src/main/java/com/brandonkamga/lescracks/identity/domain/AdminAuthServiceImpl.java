package com.brandonkamga.lescracks.identity.domain;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AdminAuthServiceImpl implements AdminAuthService {
    private final AuthenticationManager authenticationManager;

    public AdminAuthServiceImpl(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    @Override
    public Authentication authenticate(String username, String password) {
        return authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(username, password));
    }
}