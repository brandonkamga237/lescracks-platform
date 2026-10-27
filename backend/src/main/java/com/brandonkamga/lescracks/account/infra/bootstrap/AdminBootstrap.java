package com.brandonkamga.lescracks.account.infra.bootstrap;

import com.brandonkamga.lescracks.account.domain.model.Admin;
import com.brandonkamga.lescracks.account.domain.model.AdminStatus;
import com.brandonkamga.lescracks.account.domain.port.AdminStore;
import com.brandonkamga.lescracks.account.domain.port.PasswordHasher;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Creates the first admin of an empty back office from ADMIN_USERNAME / ADMIN_PASSWORD.
 *
 * Once any admin exists it does nothing: re-creating a missing username on every boot meant a
 * deployment without those variables opened an "admin"/"admin" account next to the real ones.
 */
@Component
public class AdminBootstrap implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final AdminStore admins;
    private final PasswordHasher passwords;
    private final String username;
    private final String password;

    public AdminBootstrap(AdminStore admins,
                          PasswordHasher passwords,
                          @Value("${app.admin.bootstrap-username:admin}") String username,
                          @Value("${app.admin.bootstrap-password:}") String password) {
        this.admins = admins;
        this.passwords = passwords;
        this.username = username;
        this.password = password;
    }

    @Override
    public void run(String... args) {
        if (!admins.findAll().isEmpty()) {
            return;
        }
        if (password == null || password.isBlank()) {
            throw new IllegalStateException("No admin exists yet and ADMIN_PASSWORD is not set: refusing to create one with a default password");
        }
        admins.save(Admin.builder()
                .username(username.trim())
                .passwordHash(passwords.hash(password))
                .status(AdminStatus.ACTIVE)
                .build());
        log.info("Bootstrapped admin '{}'", username.trim());
    }
}
