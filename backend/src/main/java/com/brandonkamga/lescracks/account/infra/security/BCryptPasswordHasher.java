package com.brandonkamga.lescracks.identity.infra.security;

import com.brandonkamga.lescracks.identity.domain.credential.PasswordHasher;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class BCryptPasswordHasher implements PasswordHasher {

    private final PasswordEncoder encoder;

    public BCryptPasswordHasher(PasswordEncoder encoder) {
        this.encoder = encoder;
    }

    @Override
    public String hash(String rawPassword) {
        return encoder.encode(rawPassword);
    }

    @Override
    public boolean matches(String rawPassword, String hash) {
        return encoder.matches(rawPassword, hash);
    }
}
