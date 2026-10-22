package com.brandonkamga.lescracks.identity.domain.credential;

import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.identity.domain.member.UserStatus;
import com.brandonkamga.lescracks.identity.domain.member.UserStore;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

public class UserAuthServiceImpl implements UserAuthService {
    private final UserStore users;
    private final PasswordHasher passwords;
    private final AuthMetrics metrics;

    public UserAuthServiceImpl(UserStore users, PasswordHasher passwords, AuthMetrics metrics) {
        this.users = users;
        this.passwords = passwords;
        this.metrics = metrics;
    }

    @Override
    public User authenticate(Credentials credentials) {
        User user = users.findByEmail(credentials.email().trim())
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
