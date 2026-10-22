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
        if (accounts.findByEmail(email).isPresent()) {
            metrics.register(false);
            throw new BadRequestException("Cette adresse email est déjà utilisée.");
        }
        Account account = Account.builder()
                .email(email)
                .passwordHash(passwords.hash(registration.password()))
                .firstName(registration.firstName().trim())
                .lastName(registration.lastName().trim())
                .status(AccountStatus.ACTIVE)
                .provider(AuthProvider.LOCAL)
                .build();
        Arrival arrival = registration.arrival();
        if (arrival != null) account.recordArrival(arrival.path(), arrival.language(), arrival.timezone());
        AccountSummary saved = AccountSummary.of(accounts.save(account));
        // Before the email goes out: a listener refusing the phone number undoes everything.
        events.registered(new AccountRegistered(saved.getId(), saved.getEmail(), saved.getFirstName(), saved.getLastName(), registration.phone(),
                registration.marketingConsent(), Boolean.TRUE.equals(registration.newsletter())));
        verification.send(saved);
        metrics.register(true);
        return saved;
    }
}
