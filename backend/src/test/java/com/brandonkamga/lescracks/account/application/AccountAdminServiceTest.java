package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountStatus;
import com.brandonkamga.lescracks.account.domain.model.AuthProvider;
import com.brandonkamga.lescracks.shared.exception.ConflictException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AccountAdminServiceTest {

    private final InMemoryAccountStore accounts = new InMemoryAccountStore();
    @Mock private EmailVerificationService verification;

    private AccountAdminServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AccountAdminServiceImpl(accounts, verification);
    }

    @Test
    @DisplayName("support resends the link to a member whose address is not confirmed")
    void resends() {
        Account member = accounts.save(Account.builder().email("awa@example.com").passwordHash("hash").build());

        service.resendVerification(member.getId());

        verify(verification).send(AccountSummary.of(member));
    }

    @Test
    @DisplayName("an address already confirmed gets no new link")
    void alreadyConfirmed() {
        Account member = accounts.save(Account.builder().email("a@example.com").passwordHash("hash").emailVerified(true).build());

        assertThatThrownBy(() -> service.resendVerification(member.getId())).isInstanceOf(ConflictException.class);
        verify(verification, never()).send(any());
    }

    @Test
    @DisplayName("support can confirm an address by hand, and a suspension sticks")
    void changesStick() {
        Account member = accounts.save(Account.builder().email("g@example.com").provider(AuthProvider.GITHUB).build());

        service.markVerified(member.getId());
        service.setStatus(member.getId(), AccountStatus.BANNED);

        assertThat(accounts.stored(member.getId()).isEmailVerified()).isTrue();
        assertThat(accounts.stored(member.getId()).getStatus()).isEqualTo(AccountStatus.BANNED);
    }
}
