package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountSettingsServiceTest {

    private final InMemoryAccountStore accounts = new InMemoryAccountStore();
    @Mock private PasswordHasher passwords;

    private AccountSettingsServiceImpl service;
    private Account account;

    @BeforeEach
    void setUp() {
        service = new AccountSettingsServiceImpl(accounts, passwords);
        account = accounts.save(Account.builder().email("awa@example.com").passwordHash("old").build());
    }

    @Test
    @DisplayName("the right current password and a matching confirmation replace the password")
    void changes() {
        when(passwords.matches("current", "old")).thenReturn(true);
        when(passwords.hash("brand-new-password")).thenReturn("new");

        service.changePassword("awa@example.com", new PasswordChange("current", "brand-new-password", "brand-new-password"));

        assertThat(accounts.stored(account.getId()).getPasswordHash()).isEqualTo("new");
    }

    @Test
    @DisplayName("a wrong current password or a confirmation that differs changes nothing")
    void refuses() {
        when(passwords.matches("wrong", "old")).thenReturn(false);
        when(passwords.matches("current", "old")).thenReturn(true);

        assertThatThrownBy(() -> service.changePassword("awa@example.com", new PasswordChange("wrong", "brand-new-password", "brand-new-password")))
                .isInstanceOf(BadRequestException.class).hasMessage("Le mot de passe actuel est incorrect.");
        assertThatThrownBy(() -> service.changePassword("awa@example.com", new PasswordChange("current", "brand-new-password", "other")))
                .isInstanceOf(BadRequestException.class);
        assertThat(accounts.stored(account.getId()).getPasswordHash()).isEqualTo("old");
    }

    @Test
    @DisplayName("closing the account deletes it")
    void closes() {
        service.close("awa@example.com");

        assertThat(accounts.findById(account.getId())).isEmpty();
    }
}
