package com.brandonkamga.lescracks.identity.domain.admin;

import com.brandonkamga.lescracks.identity.domain.credential.AuthMetrics;
import com.brandonkamga.lescracks.identity.domain.credential.PasswordHasher;
import com.brandonkamga.lescracks.shared.exception.UnauthenticatedException;

import java.util.Optional;
import java.util.UUID;

public class AdminAuthServiceImpl implements AdminAuthService {

    private final AdminStore admins;
    private final PasswordHasher passwords;
    private final AuthMetrics metrics;
    // Checked when the username is unknown, so a wrong username takes as long as a wrong password
    // and the timing does not tell which usernames exist.
    private final String decoyHash;

    public AdminAuthServiceImpl(AdminStore admins, PasswordHasher passwords, AuthMetrics metrics) {
        this.admins = admins;
        this.passwords = passwords;
        this.metrics = metrics;
        this.decoyHash = passwords.hash(UUID.randomUUID().toString());
    }

    @Override
    public Admin authenticate(String username, String password) {
        Optional<Admin> admin = admins.findByUsername(username.trim());
        boolean matches = passwords.matches(password, admin.map(Admin::getPasswordHash).orElse(decoyHash));
        if (admin.isEmpty() || !matches || !admin.get().isActive()) {
            metrics.login("admin", "local", false);
            throw new UnauthenticatedException("Identifiant ou mot de passe incorrect.");
        }
        metrics.login("admin", "local", true);
        return admin.get();
    }
}
