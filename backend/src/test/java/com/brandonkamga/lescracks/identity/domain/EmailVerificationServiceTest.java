package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.infra.EmailVerificationTokenRepository;
import com.brandonkamga.lescracks.identity.infra.UserRepository;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock private UserRepository users;
    @Mock private EmailVerificationTokenRepository tokens;
    @Mock private Mailer mail;

    private final OneTimeTokens oneTimeTokens = new OneTimeTokens();
    private EmailVerificationServiceImpl service;
    private User member;

    @BeforeEach
    void setUp() {
        service = new EmailVerificationServiceImpl(users, tokens, oneTimeTokens, mail);
        member = User.builder().id(3L).email("awa@example.com").firstName("Awa").build();
    }

    @Test
    @DisplayName("the email carries the raw token, the database only its hash, valid for 24 hours")
    void sendsALink() {
        service.send(member);

        ArgumentCaptor<EmailVerificationToken> stored = ArgumentCaptor.forClass(EmailVerificationToken.class);
        verify(tokens).save(stored.capture());
        ArgumentCaptor<Email> sent = ArgumentCaptor.forClass(Email.class);
        verify(mail).send(sent.capture());
        VerificationEmail email = (VerificationEmail) sent.getValue();
        assertThat(email.to()).isEqualTo("awa@example.com");
        assertThat(email.firstName()).isEqualTo("Awa");
        assertThat(stored.getValue().getTokenHash()).isEqualTo(oneTimeTokens.hash(email.token()));
        assertThat(stored.getValue().getExpiresAt()).isBetween(Instant.now().plus(23, ChronoUnit.HOURS), Instant.now().plus(25, ChronoUnit.HOURS));
    }

    @Test
    @DisplayName("a valid link verifies the address and cannot be used twice")
    void verifiesOnce() {
        EmailVerificationToken token = EmailVerificationToken.builder().user(member).tokenHash(oneTimeTokens.hash("raw"))
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS)).build();
        when(tokens.findByTokenHash(oneTimeTokens.hash("raw"))).thenReturn(Optional.of(token));

        service.verify("raw");

        assertThat(member.isEmailVerified()).isTrue();
        assertThat(token.isValid()).isFalse();
    }

    @Test
    @DisplayName("an expired link is refused and leaves the address unverified")
    void refusesAnExpiredLink() {
        EmailVerificationToken token = EmailVerificationToken.builder().user(member).tokenHash(oneTimeTokens.hash("raw"))
                .expiresAt(Instant.now().minus(1, ChronoUnit.MINUTES)).build();
        when(tokens.findByTokenHash(oneTimeTokens.hash("raw"))).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.verify("raw")).isInstanceOf(BadRequestException.class);
        assertThat(member.isEmailVerified()).isFalse();
    }

    @Test
    @DisplayName("a member asking again gets a new link")
    void sendsAgain() {
        when(users.findByEmailIgnoreCase("awa@example.com")).thenReturn(Optional.of(member));
        when(tokens.findFirstByUserOrderByCreatedAtDesc(member)).thenReturn(Optional.of(
                EmailVerificationToken.builder().createdAt(Instant.now().minus(5, ChronoUnit.MINUTES)).build()));

        service.sendAgain("awa@example.com");

        verify(mail).send(any(VerificationEmail.class));
    }

    @Test
    @DisplayName("asking again within a minute is refused with a reason, and sends nothing")
    void throttlesAMember() {
        when(users.findByEmailIgnoreCase("awa@example.com")).thenReturn(Optional.of(member));
        when(tokens.findFirstByUserOrderByCreatedAtDesc(member)).thenReturn(Optional.of(
                EmailVerificationToken.builder().createdAt(Instant.now().minusSeconds(20)).build()));

        assertThatThrownBy(() -> service.sendAgain("awa@example.com"))
                .isInstanceOf(ConflictException.class).hasMessageContaining("Patiente une minute");
        verify(mail, never()).send(any());
    }

    @Test
    @DisplayName("an address already confirmed is not sent another link")
    void alreadyVerified() {
        member.setEmailVerified(true);
        when(users.findByEmailIgnoreCase("awa@example.com")).thenReturn(Optional.of(member));

        assertThatThrownBy(() -> service.sendAgain("awa@example.com")).isInstanceOf(ConflictException.class);
        service.resend("awa@example.com");

        verify(mail, never()).send(any());
    }

    @Test
    @DisplayName("resending to an unknown address does nothing and says nothing")
    void resendIsSilent() {
        when(users.findByEmailIgnoreCase("nobody@example.com")).thenReturn(Optional.empty());

        service.resend(" nobody@example.com ");

        verify(mail, never()).send(any());
    }
}
