package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.infra.EmailVerificationTokenRepository;
import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.mail.domain.MailService;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock private UserRepository users;
    @Mock private EmailVerificationTokenRepository tokens;
    @Mock private MailService mail;

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
        ArgumentCaptor<String> raw = ArgumentCaptor.forClass(String.class);
        verify(mail).sendVerificationEmail(eq("awa@example.com"), raw.capture(), eq("Awa"));
        assertThat(stored.getValue().getTokenHash()).isEqualTo(oneTimeTokens.hash(raw.getValue()));
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
    @DisplayName("resending to an unknown address does nothing and says nothing")
    void resendIsSilent() {
        when(users.findByEmailIgnoreCase("nobody@example.com")).thenReturn(Optional.empty());

        service.resend(" nobody@example.com ");

        verify(mail, never()).sendVerificationEmail(anyString(), anyString(), any());
    }
}
