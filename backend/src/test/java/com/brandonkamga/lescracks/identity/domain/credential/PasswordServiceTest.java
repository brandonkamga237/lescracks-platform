package com.brandonkamga.lescracks.identity.domain.credential;

import com.brandonkamga.lescracks.identity.domain.member.InMemoryUserStore;
import com.brandonkamga.lescracks.identity.domain.member.User;
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
class PasswordServiceTest {

    private final InMemoryUserStore users = new InMemoryUserStore();
    @Mock private PasswordHasher passwords;

    private PasswordServiceImpl service;
    private User member;

    @BeforeEach
    void setUp() {
        service = new PasswordServiceImpl(users, passwords);
        member = users.save(User.builder().email("awa@example.com").passwordHash("old").build());
    }

    @Test
    @DisplayName("the right current password and a matching confirmation replace the password")
    void changes() {
        when(passwords.matches("current", "old")).thenReturn(true);
        when(passwords.hash("brand-new-password")).thenReturn("new");

        service.change("awa@example.com", new PasswordChange("current", "brand-new-password", "brand-new-password"));

        assertThat(users.stored(member.getId()).getPasswordHash()).isEqualTo("new");
    }

    @Test
    @DisplayName("a wrong current password or a confirmation that differs changes nothing")
    void refuses() {
        when(passwords.matches("wrong", "old")).thenReturn(false);
        when(passwords.matches("current", "old")).thenReturn(true);

        assertThatThrownBy(() -> service.change("awa@example.com", new PasswordChange("wrong", "brand-new-password", "brand-new-password")))
                .isInstanceOf(BadRequestException.class).hasMessage("Le mot de passe actuel est incorrect.");
        assertThatThrownBy(() -> service.change("awa@example.com", new PasswordChange("current", "brand-new-password", "other")))
                .isInstanceOf(BadRequestException.class);
        assertThat(users.stored(member.getId()).getPasswordHash()).isEqualTo("old");
    }
}
