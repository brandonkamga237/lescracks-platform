package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountToken;
import com.brandonkamga.lescracks.account.domain.model.OneTimeTokens;
import com.brandonkamga.lescracks.account.domain.model.TokenPurpose;
import com.brandonkamga.lescracks.mail.domain.Email;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.VerificationEmail;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    private final InMemoryAccountStore accounts = new InMemoryAccountStore();
    private final InMemoryAccountTokenStore tokens = new InMemoryAccountTokenStore();
    private final OneTimeTokens oneTimeTokens = new OneTimeTokens();
    @Mock private Mailer mail;

    private EmailVerificationServiceImpl service;
    private Account account;

    @BeforeEach
    void setUp() {
        service = new EmailVerificationServiceImpl(accounts, tokens, oneTimeTokens, mail);
        account = accounts.save(Account.builder().email("awa@example.com").firstName("Awa").passwordHash("hash").build());
    }

    private void linkSent(Instant at, Instant expiresAt) {
        tokens.save(AccountToken.builder().accountId(account.getId()).purpose(TokenPurpose.EMAIL_VERIFICATION)
                .tokenHash(oneTimeTokens.hash("raw")).createdAt(at).expiresAt(expiresAt).build());
    }

    @Test
    @DisplayName("the email carries the raw token, the database only its hash, valid for 24 hours")
    void sendsALink() {
        service.send(AccountSummary.of(account));

        ArgumentCaptor<Email> sent = ArgumentCaptor.forClass(Email.class);
        verify(mail).send(sent.capture());
        VerificationEmail email = (VerificationEmail) sent.getValue();
        assertThat(email.to()).isEqualTo("awa@example.com");
        assertThat(email.firstName()).isEqualTo("Awa");
        AccountToken stored = tokens.findByHash(TokenPurpose.EMAIL_VERIFICATION, oneTimeTokens.hash(email.token())).orElseThrow();
        assertThat(stored.getAccountId()).isEqualTo(account.getId());
        assertThat(stored.getExpiresAt()).isBetween(Instant.now().plus(23, ChronoUnit.HOURS), Instant.now().plus(25, ChronoUnit.HOURS));
    }

    @Test
    @DisplayName("a valid link verifies the address and cannot be used twice")
    void verifiesOnce() {
        linkSent(Instant.now(), Instant.now().plus(1, ChronoUnit.HOURS));

        service.verify("raw");

        assertThat(accounts.stored(account.getId()).isEmailVerified()).isTrue();
        assertThatThrownBy(() -> service.verify("raw")).isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("a password reset link cannot verify an address")
    void purposesDoNotMix() {
        tokens.save(AccountToken.builder().accountId(account.getId()).purpose(TokenPurpose.PASSWORD_RESET)
                .tokenHash(oneTimeTokens.hash("raw")).expiresAt(Instant.now().plus(1, ChronoUnit.HOURS)).build());

        assertThatThrownBy(() -> service.verify("raw")).isInstanceOf(BadRequestException.class);
        assertThat(accounts.stored(account.getId()).isEmailVerified()).isFalse();
    }

    @Test
    @DisplayName("an expired link is refused and leaves the address unverified")
    void refusesAnExpiredLink() {
        linkSent(Instant.now().minus(2, ChronoUnit.DAYS), Instant.now().minus(1, ChronoUnit.MINUTES));

        assertThatThrownBy(() -> service.verify("raw")).isInstanceOf(BadRequestException.class);
        assertThat(accounts.stored(account.getId()).isEmailVerified()).isFalse();
    }

    @Test
    @DisplayName("asking again within a minute is refused with a reason, and sends nothing")
    void throttlesAMember() {
        linkSent(Instant.now().minusSeconds(20), Instant.now().plus(1, ChronoUnit.HOURS));

        assertThatThrownBy(() -> service.sendAgain("awa@example.com"))
                .isInstanceOf(ConflictException.class).hasMessageContaining("Patiente une minute");
        verify(mail, never()).send(any());
    }

    @Test
    @DisplayName("a member asking again after a minute gets a new link")
    void sendsAgain() {
        linkSent(Instant.now().minus(5, ChronoUnit.MINUTES), Instant.now().plus(1, ChronoUnit.HOURS));

        service.sendAgain("awa@example.com");

        verify(mail).send(any(VerificationEmail.class));
    }

    @Test
    @DisplayName("resending to an unknown or confirmed address does nothing and says nothing")
    void resendIsSilent() {
        account.setEmailVerified(true);
        accounts.save(account);

        service.resend(" nobody@example.com ");
        service.resend("awa@example.com");

        verify(mail, never()).send(any());
        assertThat(tokens.count()).isZero();
    }
}
