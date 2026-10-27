package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountRenamed;
import com.brandonkamga.lescracks.account.domain.port.AccountEvents;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class AccountDirectoryTest {

    private final InMemoryAccountStore accounts = new InMemoryAccountStore();
    private final AccountEvents events = mock(AccountEvents.class);
    private AccountDirectoryImpl directory;
    private Account account;

    @BeforeEach
    void setUp() {
        directory = new AccountDirectoryImpl(accounts, events);
        account = accounts.save(Account.builder().email("eric@example.com").firstName("Eric").lastName("T").build());
    }

    @Test
    @DisplayName("a rename changes only the names given; an empty name is refused and nothing changes")
    void renames() {
        directory.rename(account.getId(), " Éric ", null);
        assertThat(accounts.stored(account.getId()).getFirstName()).isEqualTo("Éric");
        assertThat(accounts.stored(account.getId()).getLastName()).isEqualTo("T");

        assertThatThrownBy(() -> directory.rename(account.getId(), null, " ")).isInstanceOf(BadRequestException.class);
        assertThat(accounts.stored(account.getId()).getLastName()).isEqualTo("T");
    }

    @Test
    @DisplayName("a rename tells the modules that keep a copy of the name, and a refused one tells nobody")
    void renameIsPublished() {
        directory.rename(account.getId(), "Éric", "Tchana");
        assertThatThrownBy(() -> directory.rename(account.getId(), " ", null)).isInstanceOf(BadRequestException.class);

        verify(events).renamed(new AccountRenamed(account.getId(), "eric@example.com", "Éric", "Tchana"));
        verify(events, times(1)).renamed(any());
    }

    @Test
    @DisplayName("the arrival is kept from the first visit only")
    void arrivalIsKeptOnce() {
        directory.recordArrival(account.getId(), new Arrival("/blog", "fr", "Africa/Douala", "LinkedIn"));
        directory.recordArrival(account.getId(), new Arrival("/talk", "en", "Europe/Paris", "Google"));

        assertThat(accounts.stored(account.getId()).getSignupPath()).isEqualTo("/blog");
        assertThat(accounts.stored(account.getId()).getSignupTimezone()).isEqualTo("Africa/Douala");
        assertThat(accounts.stored(account.getId()).getSignupSource()).isEqualTo("LinkedIn");
    }

    @Test
    @DisplayName("unknown ids are simply absent from a batch lookup")
    void batchLookup() {
        assertThat(directory.findAll(List.of(account.getId(), 999_999L))).containsOnlyKeys(account.getId());
    }
}
