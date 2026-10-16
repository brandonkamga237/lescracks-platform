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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserRegistrationServiceTest {

    @Mock private UserRepository users;
    @Mock private PasswordEncoder passwords;
    @Mock private EmailVerificationService verification;
    @Mock private AuthMetrics metrics;

    private UserRegistrationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new UserRegistrationServiceImpl(users, passwords, verification, metrics);
    }

    private static Registration registration(String email) {
        return new Registration(email, "a-long-password", " Awa ", " Diallo ", null, true,
                new Arrival("/ressources", "fr", "Africa/Dakar"));
    }

    @Test
    @DisplayName("a new address becomes an unverified local account and receives its verification email")
    void createsAnAccount() {
        when(users.findByEmailIgnoreCase("awa@example.com")).thenReturn(Optional.empty());
        when(passwords.encode("a-long-password")).thenReturn("hash");
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User user = service.register(registration(" Awa@Example.com "));

        assertThat(user.getEmail()).isEqualTo("awa@example.com");
        assertThat(user.getFirstName()).isEqualTo("Awa");
        assertThat(user.getPasswordHash()).isEqualTo("hash");
        assertThat(user.isEmailVerified()).isFalse();
        assertThat(user.isMarketingConsent()).isTrue();
        assertThat(user.getSignupPath()).isEqualTo("/ressources");
        verify(verification).send(user);
        verify(metrics).register(true);
    }

    @Test
    @DisplayName("a newsletter-only contact with the same address becomes the account")
    void upgradesANewsletterContact() {
        User contact = User.builder().id(9L).email("awa@example.com").firstName("").lastName("").build();
        when(users.findByEmailIgnoreCase("awa@example.com")).thenReturn(Optional.of(contact));
        when(passwords.encode("a-long-password")).thenReturn("hash");
        when(users.save(contact)).thenReturn(contact);

        User user = service.register(registration("awa@example.com"));

        assertThat(user).isSameAs(contact);
        assertThat(user.hasLoginMethod()).isTrue();
        verify(verification).send(contact);
    }

    @Test
    @DisplayName("an address that already signs in is refused, and nothing is sent")
    void refusesAnExistingAccount() {
        User member = User.builder().email("awa@example.com").passwordHash("hash").build();
        when(users.findByEmailIgnoreCase("awa@example.com")).thenReturn(Optional.of(member));

        assertThatThrownBy(() -> service.register(registration("awa@example.com")))
                .isInstanceOf(BadRequestException.class);
        verify(verification, never()).send(any());
        verify(metrics).register(false);
    }

    @Test
    @DisplayName("a mistyped phone number is refused before anything is saved")
    void checksThePhoneFirst() {
        Registration withBadPhone = new Registration("awa@example.com", "a-long-password", "Awa", "Diallo", "+237 12", null, null);

        assertThatThrownBy(() -> service.register(withBadPhone)).isInstanceOf(BadRequestException.class);
        verify(users, never()).save(any());
    }
}
