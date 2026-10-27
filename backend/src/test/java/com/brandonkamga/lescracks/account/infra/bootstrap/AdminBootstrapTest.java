package com.brandonkamga.lescracks.account.infra.bootstrap;

import com.brandonkamga.lescracks.account.domain.model.Admin;
import com.brandonkamga.lescracks.account.domain.model.AdminStatus;
import com.brandonkamga.lescracks.account.domain.port.AdminStore;
import com.brandonkamga.lescracks.account.domain.port.PasswordHasher;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminBootstrapTest {

    @Mock private AdminStore admins;
    @Mock private PasswordHasher passwords;

    @Test
    @DisplayName("an empty back office gets its first admin from the configured credentials")
    void createsTheFirstAdmin() {
        when(admins.findAll()).thenReturn(List.of());
        when(passwords.hash("s3cret-long")).thenReturn("hash");

        new AdminBootstrap(admins, passwords, " root ", "s3cret-long").run();

        ArgumentCaptor<Admin> saved = ArgumentCaptor.forClass(Admin.class);
        verify(admins).save(saved.capture());
        assertThat(saved.getValue().getUsername()).isEqualTo("root");
        assertThat(saved.getValue().getPasswordHash()).isEqualTo("hash");
        assertThat(saved.getValue().getStatus()).isEqualTo(AdminStatus.ACTIVE);
    }

    @Test
    @DisplayName("once any admin exists, a different configured username creates nothing")
    void leavesAnExistingBackOfficeAlone() {
        when(admins.findAll()).thenReturn(List.of(Admin.builder().id(1L).username("brandon").build()));

        new AdminBootstrap(admins, passwords, "admin", "").run();

        verify(admins, never()).save(any());
    }

    @Test
    @DisplayName("without a password the first admin is never created with a default one: startup stops")
    void refusesADefaultPassword() {
        when(admins.findAll()).thenReturn(List.of());

        assertThatThrownBy(() -> new AdminBootstrap(admins, passwords, "admin", " ").run())
                .isInstanceOf(IllegalStateException.class);
        verify(admins, never()).save(any());
    }
}
