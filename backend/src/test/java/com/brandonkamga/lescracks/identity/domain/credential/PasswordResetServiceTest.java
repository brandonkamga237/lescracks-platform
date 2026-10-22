package com.brandonkamga.lescracks.identity.domain.credential;

import com.brandonkamga.lescracks.identity.domain.member.AuthProvider;
import com.brandonkamga.lescracks.identity.domain.member.InMemoryUserStore;
import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.PasswordResetEmail;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    private final InMemoryUserStore users = new InMemoryUserStore();
    private final InMemoryPasswordResetTokenStore tokens = new InMemoryPasswordResetTokenStore();
    @Mock private PasswordHasher passwords;
    @Mock private Mailer mail;

    private final OneTimeTokens oneTimeTokens = new OneTimeTokens();
    private PasswordResetServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PasswordResetServiceImpl(users, tokens, oneTimeTokens, passwords, mail);
    }

    @Test
    @DisplayName("an account that signs in with Google only gets no reset email")
    void ignoresAccountsWithoutPassword() {
        users.save(User.builder().email("eric@example.com").provider(AuthProvider.GOOGLE).build());

        service.request("eric@example.com");

        verify(mail, never()).send(any());
    }

    @Test
    @DisplayName("an account with a password gets a reset link")
    void sendsALink() {
        users.save(User.builder().email("awa@example.com").passwordHash("old").build());

        service.request(" awa@example.com ");

        verify(mail).send(argThat(email -> email instanceof PasswordResetEmail reset && reset.to().equals("awa@example.com")));
    }

    @Test
    @DisplayName("a valid link sets the new password once; a used link is refused")
    void resetsOnce() {
        User member = users.save(User.builder().email("awa@example.com").passwordHash("old").build());
        tokens.save(PasswordResetToken.builder().userId(member.getId()).tokenHash(oneTimeTokens.hash("raw"))
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES)).build());
        when(passwords.hash("a-new-long-password")).thenReturn("new");

        service.reset("raw", "a-new-long-password");

        assertThat(users.stored(member.getId()).getPasswordHash()).isEqualTo("new");
        assertThatThrownBy(() -> service.reset("raw", "another-long-password")).isInstanceOf(BadRequestException.class);
    }
}
