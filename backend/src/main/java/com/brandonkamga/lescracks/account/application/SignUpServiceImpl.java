package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountRegistered;
import com.brandonkamga.lescracks.account.domain.model.AccountStatus;
import com.brandonkamga.lescracks.account.domain.model.AuthProvider;
import com.brandonkamga.lescracks.account.domain.port.AccountEvents;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.account.domain.port.AuthMetrics;
import com.brandonkamga.lescracks.account.domain.port.PasswordHasher;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

public class SignUpServiceImpl implements SignUpService {
    private final AccountStore accounts;
    private final PasswordHasher passwords;
    private final EmailVerificationService verification;
    private final AuthMetrics metrics;
    private final AccountEvents events;

    public SignUpServiceImpl(AccountStore accounts, PasswordHasher passwords, EmailVerificationService verification,
                             AuthMetrics metrics, AccountEvents events) {
        this.accounts = accounts;
        this.passwords = passwords;
        this.verification = verification;
        this.metrics = metrics;
        this.events = events;
    }

    @Override
    public AccountSummary register(Registration registration) {
        String email = registration.email().trim().toLowerCase();
        Account existing = accounts.findByEmail(email).orElse(null);
        if (existing != null && existing.hasLoginMethod()) {
            metrics.register(false);
            throw new BadRequestException("Cette adresse email est déjà utilisée.");
        }
        Account account = existing != null ? existing : Account.builder()
                .email(email)
                .status(AccountStatus.ACTIVE)
                .provider(AuthProvider.LOCAL)
                .build();
        account.setPasswordHash(passwords.hash(registration.password()));
        account.setFirstName(registration.firstName().trim());
        account.setLastName(registration.lastName().trim());
        account.setEmailVerified(false);
        Arrival arrival = registration.arrival();
        if (arrival != null) account.recordArrival(arrival.path(), arrival.language(), arrival.timezone());
        AccountSummary saved = AccountSummary.of(accounts.save(account));
        // Before the email goes out: a listener refusing the phone number undoes everything.
        events.registered(new AccountRegistered(saved.getId(), saved.getEmail(), registration.phone(),
                registration.marketingConsent(), Boolean.TRUE.equals(registration.newsletter())));
        verification.send(saved);
        metrics.register(true);
        return saved;
    }
}
