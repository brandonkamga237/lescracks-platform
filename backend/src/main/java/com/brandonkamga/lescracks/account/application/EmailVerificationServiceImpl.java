package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountToken;
import com.brandonkamga.lescracks.account.domain.model.OneTimeTokens;
import com.brandonkamga.lescracks.account.domain.model.TokenPurpose;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.account.domain.port.AccountTokenStore;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.VerificationEmail;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import java.time.Duration;
import java.time.Instant;

public class EmailVerificationServiceImpl implements EmailVerificationService {
    private static final Duration VALIDITY = Duration.ofHours(24);
    private static final Duration COOLDOWN = Duration.ofMinutes(1);
    private static final String INVALID = "Le lien de vérification est invalide ou expiré.";

    private final AccountStore accounts;
    private final AccountTokenStore tokens;
    private final OneTimeTokens oneTimeTokens;
    private final Mailer mail;

    public EmailVerificationServiceImpl(AccountStore accounts, AccountTokenStore tokens,
                                        OneTimeTokens oneTimeTokens, Mailer mail) {
        this.accounts = accounts;
        this.tokens = tokens;
        this.oneTimeTokens = oneTimeTokens;
        this.mail = mail;
    }

    @Override
    public void send(AccountSummary account) {
        OneTimeTokens.Issued token = oneTimeTokens.issue();
        tokens.save(AccountToken.builder()
                .accountId(account.getId())
                .purpose(TokenPurpose.EMAIL_VERIFICATION)
                .tokenHash(token.hash())
                .expiresAt(Instant.now().plus(VALIDITY))
                .build());
        mail.send(new VerificationEmail(account.getEmail(), account.getFirstName(), token.raw()));
    }

    @Override
    public void verify(String token) {
        AccountToken verification = tokens.findByHash(TokenPurpose.EMAIL_VERIFICATION, oneTimeTokens.hash(token))
                .filter(AccountToken::isValid)
                .orElseThrow(() -> new BadRequestException(INVALID));
        Account account = accounts.findById(verification.getAccountId()).orElseThrow(() -> new BadRequestException(INVALID));
        account.setEmailVerified(true);
        accounts.save(account);
        verification.markUsed();
        tokens.save(verification);
    }

    @Override
    public void sendAgain(String email) {
        Account account = accounts.findByEmail(email.trim())
                .orElseThrow(() -> new NotFoundException("Utilisateur", "email", email));
        if (account.isEmailVerified()) {
            throw new ConflictException("Ton adresse email est déjà confirmée.");
        }
        if (sentRecently(account)) {
            throw new ConflictException("Un lien vient de t’être envoyé. Patiente une minute avant d’en demander un autre.");
        }
        send(AccountSummary.of(account));
    }

    @Override
    public void resend(String email) {
        accounts.findByEmail(email.trim())
                .filter(account -> !account.isEmailVerified() && !sentRecently(account))
                .ifPresent(account -> send(AccountSummary.of(account)));
    }

    private boolean sentRecently(Account account) {
        return tokens.findLatest(account.getId(), TokenPurpose.EMAIL_VERIFICATION)
                .map(last -> last.getCreatedAt().isAfter(Instant.now().minus(COOLDOWN)))
                .orElse(false);
    }
}
