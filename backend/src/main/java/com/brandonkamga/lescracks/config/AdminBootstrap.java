package com.brandonkamga.lescracks.config;

import com.brandonkamga.lescracks.domain.Admin;
import com.brandonkamga.lescracks.domain.AdminStatus;
import com.brandonkamga.lescracks.repository.AdminRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Ensures at least one admin exists on first prod boot.
 * The credentials come from environment variables, so they are not committed.
 */
@Component
public class AdminBootstrap implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final AdminRepository admins;
    private final PasswordEncoder passwords;
    private final String username;
    private final String password;

    public AdminBootstrap(AdminRepository admins,
                          PasswordEncoder passwords,
                          @Value("${app.admin.bootstrap-username:admin}") String username,
                          @Value("${app.admin.bootstrap-password:admin}") String password) {
        this.admins = admins;
        this.passwords = passwords;
        this.username = username;
        this.password = password;
    }

    @Override
    public void run(String... args) {
        if (admins.findByUsernameIgnoreCase(username).isPresent()) {
            return;
        }
        admins.save(Admin.builder()
                .username(username)
                .passwordHash(passwords.encode(password))
                .status(AdminStatus.ACTIVE)
                .build());
        log.info("Bootstrapped admin '{}'", username);
    }
}
