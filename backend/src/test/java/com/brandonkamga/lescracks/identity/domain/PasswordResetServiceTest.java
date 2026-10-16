package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.infra.PasswordResetTokenRepository;
import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.mail.domain.MailService;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock private UserRepository users;
    @Mock private PasswordResetTokenRepository tokens;
    @Mock private PasswordEncoder passwords;
    @Mock private MailService mail;

    private final OneTimeTokens oneTimeTokens = new OneTimeTokens();
    private PasswordResetServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PasswordResetServiceImpl(users, tokens, oneTimeTokens, passwords, mail);
    }

    @Test
    @DisplayName("an account that signs in with Google only gets no reset email")
    void ignoresAccountsWithoutPassword() {
        when(users.findByEmailIgnoreCase("eric@example.com"))
                .thenReturn(Optional.of(User.builder().email("eric@example.com").provider(AuthProvider.GOOGLE).build()));

        service.request("eric@example.com");

        verify(mail, never()).sendPasswordReset(anyString(), anyString());
    }

    @Test
    @DisplayName("an account with a password gets a reset link")
    void sendsALink() {
        when(users.findByEmailIgnoreCase("awa@example.com"))
                .thenReturn(Optional.of(User.builder().email("awa@example.com").passwordHash("old").build()));

        service.request(" awa@example.com ");

        verify(mail).sendPasswordReset(eq("awa@example.com"), anyString());
    }

    @Test
    @DisplayName("a valid link sets the new password once; a used link is refused")
    void resetsOnce() {
        User member = User.builder().email("awa@example.com").passwordHash("old").build();
        PasswordResetToken token = PasswordResetToken.builder().user(member).tokenHash(oneTimeTokens.hash("raw"))
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES)).build();
        when(tokens.findByTokenHash(oneTimeTokens.hash("raw"))).thenReturn(Optional.of(token));
        when(passwords.encode("a-new-long-password")).thenReturn("new");

        service.reset("raw", "a-new-long-password");

        assertThat(member.getPasswordHash()).isEqualTo("new");
        assertThatThrownBy(() -> service.reset("raw", "another-long-password")).isInstanceOf(BadRequestException.class);
    }
}
