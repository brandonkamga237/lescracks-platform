package com.brandonkamga.lescracks.identity.infra.config;

import com.brandonkamga.lescracks.identity.domain.admin.AdminAuthService;
import com.brandonkamga.lescracks.identity.domain.admin.AdminAuthServiceImpl;
import com.brandonkamga.lescracks.identity.domain.admin.AdminManagementService;
import com.brandonkamga.lescracks.identity.domain.admin.AdminManagementServiceImpl;
import com.brandonkamga.lescracks.identity.domain.admin.AdminStore;
import com.brandonkamga.lescracks.identity.domain.credential.AuthMetrics;
import com.brandonkamga.lescracks.identity.domain.credential.PasswordHasher;
import com.brandonkamga.lescracks.shared.config.TransactionalServices;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Builds identity's domain services. The domain stays free of Spring: it is assembled here,
 * from its ports and their adapters, and its transactions are declared here too.
 */
@Configuration
public class IdentityServices {

    private final TransactionalServices transactional;

    public IdentityServices(TransactionalServices transactional) {
        this.transactional = transactional;
    }

    @Bean
    AdminAuthService adminAuthService(AdminStore admins, PasswordHasher passwords, AuthMetrics metrics) {
        return transactional.wrap(AdminAuthService.class, new AdminAuthServiceImpl(admins, passwords, metrics));
    }

    @Bean
    AdminManagementService adminManagementService(AdminStore admins, PasswordHasher passwords) {
        return transactional.wrap(AdminManagementService.class, new AdminManagementServiceImpl(admins, passwords));
    }
}
