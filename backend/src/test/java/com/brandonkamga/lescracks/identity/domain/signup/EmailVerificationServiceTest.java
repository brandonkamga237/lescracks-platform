package com.brandonkamga.lescracks.identity.domain.signup;

import com.brandonkamga.lescracks.identity.domain.credential.OneTimeTokens;
import com.brandonkamga.lescracks.identity.domain.member.InMemoryUserStore;
import com.brandonkamga.lescracks.identity.domain.member.User;
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

    private final InMemoryUserStore users = new InMemoryUserStore();
    private final InMemoryEmailVerificationTokenStore tokens = new InMemoryEmailVerificationTokenStore();
    @Mock private Mailer mail;

    private final OneTimeTokens oneTimeTokens = new OneTimeTokens();
    private EmailVerificationServiceImpl service;
    private User member;

    @BeforeEach
    void setUp() {
        service = new EmailVerificationServiceImpl(users, tokens, oneTimeTokens, mail);
        member = users.save(User.builder().id(3L).email("awa@example.com").firstName("Awa").build());
    }

    private void linkSent(Instant at, Instant expiresAt) {
        tokens.save(EmailVerificationToken.builder().userId(3L).tokenHash(oneTimeTokens.hash("raw"))
                .createdAt(at).expiresAt(expiresAt).build());
    }

    @Test
    @DisplayName("the email carries the raw token, the database only its hash, valid for 24 hours")
    void sendsALink() {
        service.send(member);

        ArgumentCaptor<Email> sent = ArgumentCaptor.forClass(Email.class);
        verify(mail).send(sent.capture());
        VerificationEmail email = (VerificationEmail) sent.getValue();
        assertThat(email.to()).isEqualTo("awa@example.com");
        assertThat(email.firstName()).isEqualTo("Awa");
        EmailVerificationToken stored = tokens.findByTokenHash(oneTimeTokens.hash(email.token())).orElseThrow();
        assertThat(stored.getUserId()).isEqualTo(3L);
        assertThat(stored.getExpiresAt()).isBetween(Instant.now().plus(23, ChronoUnit.HOURS), Instant.now().plus(25, ChronoUnit.HOURS));
    }

    @Test
    @DisplayName("a valid link verifies the address and cannot be used twice")
    void verifiesOnce() {
        linkSent(Instant.now(), Instant.now().plus(1, ChronoUnit.HOURS));

        service.verify("raw");

        assertThat(users.stored(3L).isEmailVerified()).isTrue();
        assertThatThrownBy(() -> service.verify("raw")).isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("an expired link is refused and leaves the address unverified")
    void refusesAnExpiredLink() {
        linkSent(Instant.now().minus(2, ChronoUnit.DAYS), Instant.now().minus(1, ChronoUnit.MINUTES));

        assertThatThrownBy(() -> service.verify("raw")).isInstanceOf(BadRequestException.class);
        assertThat(users.stored(3L).isEmailVerified()).isFalse();
    }

    @Test
    @DisplayName("a member asking again gets a new link")
    void sendsAgain() {
        linkSent(Instant.now().minus(5, ChronoUnit.MINUTES), Instant.now().plus(1, ChronoUnit.HOURS));

        service.sendAgain("awa@example.com");

        verify(mail).send(any(VerificationEmail.class));
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
    @DisplayName("an address already confirmed is not sent another link")
    void alreadyVerified() {
        member.setEmailVerified(true);
        users.save(member);

        assertThatThrownBy(() -> service.sendAgain("awa@example.com")).isInstanceOf(ConflictException.class);
        service.resend("awa@example.com");

        verify(mail, never()).send(any());
    }

    @Test
    @DisplayName("resending to an unknown address does nothing and says nothing")
    void resendIsSilent() {
        service.resend(" nobody@example.com ");

        verify(mail, never()).send(any());
        assertThat(tokens.count()).isZero();
    }
}
