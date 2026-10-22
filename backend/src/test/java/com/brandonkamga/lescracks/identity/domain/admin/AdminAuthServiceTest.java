package com.brandonkamga.lescracks.identity.domain.admin;

import com.brandonkamga.lescracks.identity.domain.credential.AuthMetrics;
import com.brandonkamga.lescracks.identity.domain.credential.PasswordHasher;
import com.brandonkamga.lescracks.shared.exception.UnauthenticatedException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAuthServiceTest {

    @Mock private AdminStore admins;
    @Mock private PasswordHasher passwords;
    @Mock private AuthMetrics metrics;

    private AdminAuthServiceImpl service;

    @BeforeEach
    void setUp() {
        when(passwords.hash(anyString())).thenReturn("decoy");
        service = new AdminAuthServiceImpl(admins, passwords, metrics);
    }

    private Admin admin(AdminStatus status) {
        Admin admin = Admin.builder().id(1L).username("root").passwordHash("hash").status(status).build();
        when(admins.findByUsername("root")).thenReturn(Optional.of(admin));
        return admin;
    }

    @Test
    @DisplayName("the right password opens the back office and is counted as a success")
    void authenticates() {
        Admin admin = admin(AdminStatus.ACTIVE);
        when(passwords.matches("secret", "hash")).thenReturn(true);

        assertThat(service.authenticate(" root ", "secret")).isSameAs(admin);
        verify(metrics).login("admin", "local", true);
    }

    @Test
    @DisplayName("a wrong password and a disabled account get the same 401, so neither tells which it was")
    void refuses() {
        admin(AdminStatus.INACTIVE);
        when(passwords.matches("secret", "hash")).thenReturn(true);

        assertThatThrownBy(() -> service.authenticate("root", "secret"))
                .isInstanceOf(UnauthenticatedException.class)
                .hasMessage("Identifiant ou mot de passe incorrect.");
        verify(metrics).login("admin", "local", false);
    }

    @Test
    @DisplayName("an unknown username still checks a password, so it takes as long as a known one")
    void unknownUsernameStillHashes() {
        when(admins.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.authenticate("ghost", "secret")).isInstanceOf(UnauthenticatedException.class);
        verify(passwords).matches(eq("secret"), eq("decoy"));
    }
}
