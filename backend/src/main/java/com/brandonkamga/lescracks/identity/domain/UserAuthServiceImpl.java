package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserAuthServiceImpl implements UserAuthService {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final AuthMetrics metrics;

    public UserAuthServiceImpl(UserRepository users, PasswordEncoder passwords, AuthMetrics metrics) {
        this.users = users;
        this.passwords = passwords;
        this.metrics = metrics;
    }

    @Override
    public User authenticate(Credentials credentials) {
        User user = users.findByEmailIgnoreCase(credentials.email().trim())
                .filter(candidate -> candidate.getPasswordHash() != null
                        && passwords.matches(credentials.password(), candidate.getPasswordHash())
                        && candidate.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> {
                    metrics.login("member", "local", false);
                    return new BadRequestException("Email ou mot de passe incorrect.");
                });
        metrics.login("member", "local", true);
        return user;
    }
}
