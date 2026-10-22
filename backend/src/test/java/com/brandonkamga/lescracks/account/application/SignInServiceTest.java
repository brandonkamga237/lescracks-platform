package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountStatus;
import com.brandonkamga.lescracks.account.domain.port.AuthMetrics;
import com.brandonkamga.lescracks.account.domain.port.PasswordHasher;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SignInServiceTest {

    private final InMemoryAccountStore accounts = new InMemoryAccountStore();
    @Mock private PasswordHasher passwords;
    @Mock private AuthMetrics metrics;

    private SignInServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new SignInServiceImpl(accounts, passwords, metrics);
    }

    private Account account(boolean verified, AccountStatus status) {
        return accounts.save(Account.builder().email("awa@example.com").passwordHash("hash").emailVerified(verified).status(status).build());
    }

    @Test
    @DisplayName("the right password signs in, even before the address is confirmed")
    void signsIn() {
        Account account = account(false, AccountStatus.ACTIVE);
        when(passwords.matches("secret-password", "hash")).thenReturn(true);

        assertThat(service.authenticate(new Credentials(" awa@example.com ", "secret-password")).getId()).isEqualTo(account.getId());
        verify(metrics).login("member", "local", true);
    }

    @Test
    @DisplayName("a wrong password gets the same answer as an unknown address")
    void wrongPassword() {
        account(true, AccountStatus.ACTIVE);
        when(passwords.matches("nope", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.authenticate(new Credentials("awa@example.com", "nope")))
                .isInstanceOf(BadRequestException.class).hasMessage("Email ou mot de passe incorrect.");
        assertThatThrownBy(() -> service.authenticate(new Credentials("nobody@example.com", "nope")))
                .isInstanceOf(BadRequestException.class).hasMessage("Email ou mot de passe incorrect.");
    }

    @Test
    @DisplayName("a banned account cannot sign in, even with the right password")
    void bannedIsRefused() {
        account(true, AccountStatus.BANNED);
        when(passwords.matches("secret-password", "hash")).thenReturn(true);

        assertThatThrownBy(() -> service.authenticate(new Credentials("awa@example.com", "secret-password")))
                .isInstanceOf(BadRequestException.class);
        verify(metrics).login("member", "local", false);
    }
}
