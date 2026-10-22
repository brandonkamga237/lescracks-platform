package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.account.domain.port.AuthMetrics;
import com.brandonkamga.lescracks.account.domain.port.PasswordHasher;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

public class SignInServiceImpl implements SignInService {
    private final AccountStore accounts;
    private final PasswordHasher passwords;
    private final AuthMetrics metrics;

    public SignInServiceImpl(AccountStore accounts, PasswordHasher passwords, AuthMetrics metrics) {
        this.accounts = accounts;
        this.passwords = passwords;
        this.metrics = metrics;
    }

    @Override
    public AccountSummary authenticate(Credentials credentials) {
        Account account = accounts.findByEmail(credentials.email().trim())
                .filter(candidate -> candidate.getPasswordHash() != null
                        && passwords.matches(credentials.password(), candidate.getPasswordHash())
                        && candidate.isActive())
                .orElseThrow(() -> {
                    metrics.login("member", "local", false);
                    return new BadRequestException("Email ou mot de passe incorrect.");
                });
        metrics.login("member", "local", true);
        return AccountSummary.of(account);
    }
}
