package com.brandonkamga.lescracks.identity.infra.config;

import com.brandonkamga.lescracks.identity.domain.admin.AdminAuthService;
import com.brandonkamga.lescracks.identity.domain.admin.AdminAuthServiceImpl;
import com.brandonkamga.lescracks.identity.domain.admin.AdminManagementService;
import com.brandonkamga.lescracks.identity.domain.admin.AdminManagementServiceImpl;
import com.brandonkamga.lescracks.identity.domain.admin.AdminStore;
import com.brandonkamga.lescracks.identity.domain.admin.AdminUserService;
import com.brandonkamga.lescracks.identity.domain.admin.AdminUserServiceImpl;
import com.brandonkamga.lescracks.identity.domain.credential.AuthMetrics;
import com.brandonkamga.lescracks.identity.domain.credential.OneTimeTokens;
import com.brandonkamga.lescracks.identity.domain.credential.PasswordHasher;
import com.brandonkamga.lescracks.identity.domain.credential.PasswordResetService;
import com.brandonkamga.lescracks.identity.domain.credential.PasswordResetServiceImpl;
import com.brandonkamga.lescracks.identity.domain.credential.PasswordResetTokenStore;
import com.brandonkamga.lescracks.identity.domain.credential.PasswordService;
import com.brandonkamga.lescracks.identity.domain.credential.PasswordServiceImpl;
import com.brandonkamga.lescracks.identity.domain.credential.UserAuthService;
import com.brandonkamga.lescracks.identity.domain.credential.UserAuthServiceImpl;
import com.brandonkamga.lescracks.identity.domain.external.IdentityTokenVerifier;
import com.brandonkamga.lescracks.identity.domain.external.OidcSyncService;
import com.brandonkamga.lescracks.identity.domain.external.OidcSyncServiceImpl;
import com.brandonkamga.lescracks.identity.domain.external.UserIdentityService;
import com.brandonkamga.lescracks.identity.domain.external.UserIdentityServiceImpl;
import com.brandonkamga.lescracks.identity.domain.external.UserIdentityStore;
import com.brandonkamga.lescracks.identity.domain.member.UserDirectory;
import com.brandonkamga.lescracks.identity.domain.member.UserDirectoryImpl;
import com.brandonkamga.lescracks.identity.domain.member.UserProfileService;
import com.brandonkamga.lescracks.identity.domain.member.UserProfileServiceImpl;
import com.brandonkamga.lescracks.identity.domain.member.UserStore;
import com.brandonkamga.lescracks.identity.domain.signup.EmailVerificationService;
import com.brandonkamga.lescracks.identity.domain.signup.EmailVerificationServiceImpl;
import com.brandonkamga.lescracks.identity.domain.signup.EmailVerificationTokenStore;
import com.brandonkamga.lescracks.identity.domain.signup.MemberEvents;
import com.brandonkamga.lescracks.identity.domain.signup.UserRegistrationService;
import com.brandonkamga.lescracks.identity.domain.signup.UserRegistrationServiceImpl;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.shared.config.TransactionalServices;
import com.brandonkamga.lescracks.storage.domain.StorageService;
import com.brandonkamga.lescracks.taxonomy.domain.TaxonomyService;

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
    OneTimeTokens oneTimeTokens() {
        return new OneTimeTokens();
    }

    @Bean
    UserDirectory userDirectory(UserStore users) {
        return transactional.wrap(UserDirectory.class, new UserDirectoryImpl(users));
    }

    @Bean
    UserProfileService userProfileService(UserStore users, StorageService storage, TaxonomyService taxonomy) {
        return transactional.wrap(UserProfileService.class, new UserProfileServiceImpl(users, storage, taxonomy));
    }

    @Bean
    EmailVerificationService emailVerificationService(UserStore users, EmailVerificationTokenStore tokens,
                                                      OneTimeTokens oneTimeTokens, Mailer mail) {
        return transactional.wrap(EmailVerificationService.class,
                new EmailVerificationServiceImpl(users, tokens, oneTimeTokens, mail));
    }

    @Bean
    UserRegistrationService userRegistrationService(UserStore users, PasswordHasher passwords,
                                                    EmailVerificationService verification, AuthMetrics metrics,
                                                    MemberEvents events) {
        return transactional.wrap(UserRegistrationService.class,
                new UserRegistrationServiceImpl(users, passwords, verification, metrics, events));
    }

    @Bean
    UserAuthService userAuthService(UserStore users, PasswordHasher passwords, AuthMetrics metrics) {
        return transactional.wrap(UserAuthService.class, new UserAuthServiceImpl(users, passwords, metrics));
    }

    @Bean
    PasswordService passwordService(UserStore users, PasswordHasher passwords) {
        return transactional.wrap(PasswordService.class, new PasswordServiceImpl(users, passwords));
    }

    @Bean
    PasswordResetService passwordResetService(UserStore users, PasswordResetTokenStore tokens,
                                              OneTimeTokens oneTimeTokens, PasswordHasher passwords, Mailer mail) {
        return transactional.wrap(PasswordResetService.class,
                new PasswordResetServiceImpl(users, tokens, oneTimeTokens, passwords, mail));
    }

    @Bean
    OidcSyncService oidcSyncService(UserStore users, UserIdentityStore identities, IdentityTokenVerifier tokens) {
        return transactional.wrap(OidcSyncService.class, new OidcSyncServiceImpl(users, identities, tokens));
    }

    @Bean
    UserIdentityService userIdentityService(UserStore users, UserIdentityStore identities, IdentityTokenVerifier tokens) {
        return transactional.wrap(UserIdentityService.class, new UserIdentityServiceImpl(users, identities, tokens));
    }

    @Bean
    AdminAuthService adminAuthService(AdminStore admins, PasswordHasher passwords, AuthMetrics metrics) {
        return transactional.wrap(AdminAuthService.class, new AdminAuthServiceImpl(admins, passwords, metrics));
    }

    @Bean
    AdminManagementService adminManagementService(AdminStore admins, PasswordHasher passwords) {
        return transactional.wrap(AdminManagementService.class, new AdminManagementServiceImpl(admins, passwords));
    }

    @Bean
    AdminUserService adminUserService(UserStore users, EmailVerificationService verification) {
        return transactional.wrap(AdminUserService.class, new AdminUserServiceImpl(users, verification));
    }
}
