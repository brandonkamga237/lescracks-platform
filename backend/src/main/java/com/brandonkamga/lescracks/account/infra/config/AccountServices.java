package com.brandonkamga.lescracks.account.infra.config;

import com.brandonkamga.lescracks.account.application.AccountAdminService;
import com.brandonkamga.lescracks.account.application.AccountAdminServiceImpl;
import com.brandonkamga.lescracks.account.application.AccountDirectory;
import com.brandonkamga.lescracks.account.application.AccountDirectoryImpl;
import com.brandonkamga.lescracks.account.application.AccountSettingsService;
import com.brandonkamga.lescracks.account.application.AccountSettingsServiceImpl;
import com.brandonkamga.lescracks.account.application.AdminAuthService;
import com.brandonkamga.lescracks.account.application.AdminAuthServiceImpl;
import com.brandonkamga.lescracks.account.application.AdminManagementService;
import com.brandonkamga.lescracks.account.application.AdminManagementServiceImpl;
import com.brandonkamga.lescracks.account.application.EmailVerificationService;
import com.brandonkamga.lescracks.account.application.EmailVerificationServiceImpl;
import com.brandonkamga.lescracks.account.application.ExternalIdentityService;
import com.brandonkamga.lescracks.account.application.ExternalIdentityServiceImpl;
import com.brandonkamga.lescracks.account.application.OidcSyncService;
import com.brandonkamga.lescracks.account.application.OidcSyncServiceImpl;
import com.brandonkamga.lescracks.account.application.PasswordResetService;
import com.brandonkamga.lescracks.account.application.PasswordResetServiceImpl;
import com.brandonkamga.lescracks.account.application.SignInService;
import com.brandonkamga.lescracks.account.application.SignInServiceImpl;
import com.brandonkamga.lescracks.account.application.SignUpService;
import com.brandonkamga.lescracks.account.application.SignUpServiceImpl;
import com.brandonkamga.lescracks.account.domain.model.OneTimeTokens;
import com.brandonkamga.lescracks.account.domain.port.AccountEvents;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.account.domain.port.AccountTokenStore;
import com.brandonkamga.lescracks.account.domain.port.AdminStore;
import com.brandonkamga.lescracks.account.domain.port.AuthMetrics;
import com.brandonkamga.lescracks.account.domain.port.ExternalIdentityStore;
import com.brandonkamga.lescracks.account.domain.port.IdentityTokenVerifier;
import com.brandonkamga.lescracks.account.domain.port.PasswordHasher;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.shared.config.TransactionalServices;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Builds account's use cases from their ports and adapters, each inside its transaction. */
@Configuration
public class AccountServices {

    private final TransactionalServices transactional;

    public AccountServices(TransactionalServices transactional) {
        this.transactional = transactional;
    }

    @Bean
    OneTimeTokens oneTimeTokens() {
        return new OneTimeTokens();
    }

    @Bean
    AccountDirectory accountDirectory(AccountStore accounts, AccountEvents events) {
        return transactional.wrap(AccountDirectory.class, new AccountDirectoryImpl(accounts, events));
    }

    @Bean
    EmailVerificationService emailVerificationService(AccountStore accounts, AccountTokenStore tokens,
                                                      OneTimeTokens oneTimeTokens, Mailer mail) {
        return transactional.wrap(EmailVerificationService.class,
                new EmailVerificationServiceImpl(accounts, tokens, oneTimeTokens, mail));
    }

    @Bean
    SignUpService signUpService(AccountStore accounts, PasswordHasher passwords, EmailVerificationService verification,
                                AuthMetrics metrics, AccountEvents events) {
        return transactional.wrap(SignUpService.class,
                new SignUpServiceImpl(accounts, passwords, verification, metrics, events));
    }

    @Bean
    SignInService signInService(AccountStore accounts, PasswordHasher passwords, AuthMetrics metrics) {
        return transactional.wrap(SignInService.class, new SignInServiceImpl(accounts, passwords, metrics));
    }

    @Bean
    PasswordResetService passwordResetService(AccountStore accounts, AccountTokenStore tokens,
                                              OneTimeTokens oneTimeTokens, PasswordHasher passwords, Mailer mail) {
        return transactional.wrap(PasswordResetService.class,
                new PasswordResetServiceImpl(accounts, tokens, oneTimeTokens, passwords, mail));
    }

    @Bean
    AccountSettingsService accountSettingsService(AccountStore accounts, PasswordHasher passwords) {
        return transactional.wrap(AccountSettingsService.class, new AccountSettingsServiceImpl(accounts, passwords));
    }

    @Bean
    ExternalIdentityService externalIdentityService(AccountStore accounts, ExternalIdentityStore identities,
                                                    IdentityTokenVerifier tokens) {
        return transactional.wrap(ExternalIdentityService.class, new ExternalIdentityServiceImpl(accounts, identities, tokens));
    }

    @Bean
    OidcSyncService oidcSyncService(AccountStore accounts, ExternalIdentityStore identities, IdentityTokenVerifier tokens,
                                    AuthMetrics metrics) {
        return transactional.wrap(OidcSyncService.class, new OidcSyncServiceImpl(accounts, identities, tokens, metrics));
    }

    @Bean
    AccountAdminService accountAdminService(AccountStore accounts, EmailVerificationService verification) {
        return transactional.wrap(AccountAdminService.class, new AccountAdminServiceImpl(accounts, verification));
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
