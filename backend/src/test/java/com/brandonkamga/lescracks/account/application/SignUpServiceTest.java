package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountRegistered;
import com.brandonkamga.lescracks.account.domain.port.AccountEvents;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SignUpServiceTest {

    private final InMemoryAccountStore accounts = new InMemoryAccountStore();
    @Mock private PasswordHasher passwords;
    @Mock private EmailVerificationService verification;
    @Mock private AuthMetrics metrics;
    @Mock private AccountEvents events;

    private SignUpServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new SignUpServiceImpl(accounts, passwords, verification, metrics, events);
    }

    private static Registration registration(String email) {
        return new Registration(email, "a-long-password", " Awa ", " Diallo ", "+237 6 77 12 34 56", true, true,
                new Arrival("/ressources", "fr", "Africa/Dakar"));
    }

    @Test
    @DisplayName("a new address becomes an unverified local account, announced with its sign-up answers")
    void createsAnAccount() {
        when(passwords.hash("a-long-password")).thenReturn("hash");

        AccountSummary created = service.register(registration(" Awa@Example.com "));

        Account stored = accounts.stored(created.getId());
        assertThat(stored.getEmail()).isEqualTo("awa@example.com");
        assertThat(stored.getFirstName()).isEqualTo("Awa");
        assertThat(stored.getPasswordHash()).isEqualTo("hash");
        assertThat(stored.isEmailVerified()).isFalse();
        assertThat(stored.getSignupPath()).isEqualTo("/ressources");
        verify(events).registered(new AccountRegistered(created.getId(), "awa@example.com", "+237 6 77 12 34 56", true, true));
        verify(verification).send(created);
        verify(metrics).register(true);
    }

    @Test
    @DisplayName("a newsletter-only contact with the same address becomes the account")
    void upgradesANewsletterContact() {
        Account contact = accounts.save(Account.builder().email("awa@example.com").firstName("").lastName("").build());
        when(passwords.hash("a-long-password")).thenReturn("hash");

        AccountSummary created = service.register(registration("awa@example.com"));

        assertThat(created.getId()).isEqualTo(contact.getId());
        assertThat(accounts.stored(contact.getId()).hasLoginMethod()).isTrue();
    }

    @Test
    @DisplayName("an address that already signs in is refused, and nothing is sent")
    void refusesAnExistingAccount() {
        accounts.save(Account.builder().email("awa@example.com").passwordHash("hash").build());

        assertThatThrownBy(() -> service.register(registration("awa@example.com"))).isInstanceOf(BadRequestException.class);
        verify(verification, never()).send(any());
        verify(events, never()).registered(any());
        verify(metrics).register(false);
    }
}
