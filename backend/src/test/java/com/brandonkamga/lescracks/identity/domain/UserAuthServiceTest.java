package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserAuthServiceTest {

    @Mock private UserRepository users;
    @Mock private PasswordEncoder passwords;
    @Mock private AuthMetrics metrics;

    private UserAuthServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new UserAuthServiceImpl(users, passwords, metrics);
    }

    private User member(boolean verified) {
        User user = User.builder().email("awa@example.com").passwordHash("hash").emailVerified(verified).build();
        when(users.findByEmailIgnoreCase("awa@example.com")).thenReturn(Optional.of(user));
        return user;
    }

    @Test
    @DisplayName("the right password on a verified account signs in")
    void signsIn() {
        User user = member(true);
        when(passwords.matches("secret-password", "hash")).thenReturn(true);

        assertThat(service.authenticate(new Credentials(" awa@example.com ", "secret-password"))).isSameAs(user);
        verify(metrics).login("member", "local", true);
    }

    @Test
    @DisplayName("a wrong password gets the same answer as an unknown address")
    void wrongPassword() {
        member(true);
        when(passwords.matches("nope", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.authenticate(new Credentials("awa@example.com", "nope")))
                .isInstanceOf(BadRequestException.class).hasMessage("Email ou mot de passe incorrect.");
    }

    @Test
    @DisplayName("an unverified address is told to check its inbox")
    void unverified() {
        member(false);
        when(passwords.matches("secret-password", "hash")).thenReturn(true);

        assertThatThrownBy(() -> service.authenticate(new Credentials("awa@example.com", "secret-password")))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("vérifiée");
    }
}
