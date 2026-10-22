package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountToken;
import com.brandonkamga.lescracks.account.domain.model.OneTimeTokens;
import com.brandonkamga.lescracks.account.domain.model.TokenPurpose;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.account.domain.port.AccountTokenStore;
import com.brandonkamga.lescracks.account.domain.port.PasswordHasher;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.PasswordResetEmail;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import java.time.Duration;
import java.time.Instant;

public class PasswordResetServiceImpl implements PasswordResetService {
    private static final Duration VALIDITY = Duration.ofMinutes(30);
    private static final String INVALID = "Le lien de réinitialisation est invalide ou expiré.";

    private final AccountStore accounts;
    private final AccountTokenStore tokens;
    private final OneTimeTokens oneTimeTokens;
    private final PasswordHasher passwords;
    private final Mailer mail;

    public PasswordResetServiceImpl(AccountStore accounts, AccountTokenStore tokens,
                                    OneTimeTokens oneTimeTokens, PasswordHasher passwords, Mailer mail) {
        this.accounts = accounts;
        this.tokens = tokens;
        this.oneTimeTokens = oneTimeTokens;
        this.passwords = passwords;
        this.mail = mail;
    }

    @Override
    public void request(String email) {
        accounts.findByEmail(email.trim())
                .filter(account -> account.getPasswordHash() != null)
                .ifPresent(account -> {
                    OneTimeTokens.Issued token = oneTimeTokens.issue();
                    tokens.save(AccountToken.builder()
                            .accountId(account.getId())
                            .purpose(TokenPurpose.PASSWORD_RESET)
                            .tokenHash(token.hash())
                            .expiresAt(Instant.now().plus(VALIDITY))
                            .build());
                    mail.send(new PasswordResetEmail(account.getEmail(), token.raw()));
                });
    }

    @Override
    public void reset(String token, String newPassword) {
        AccountToken reset = tokens.findByHash(TokenPurpose.PASSWORD_RESET, oneTimeTokens.hash(token))
                .filter(AccountToken::isValid)
                .orElseThrow(() -> new BadRequestException(INVALID));
        Account account = accounts.findById(reset.getAccountId()).orElseThrow(() -> new BadRequestException(INVALID));
        account.setPasswordHash(passwords.hash(newPassword));
        accounts.save(account);
        reset.markUsed();
        tokens.save(reset);
    }
}
