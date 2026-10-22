package com.brandonkamga.lescracks.identity.domain.signup;

import com.brandonkamga.lescracks.identity.domain.credential.AuthMetrics;
import com.brandonkamga.lescracks.identity.domain.credential.PasswordHasher;
import com.brandonkamga.lescracks.identity.domain.member.Arrival;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserRegistrationServiceTest {

    private final InMemoryUserStore users = new InMemoryUserStore();
    @Mock private PasswordHasher passwords;
    @Mock private EmailVerificationService verification;
    @Mock private AuthMetrics metrics;
    @Mock private MemberEvents events;

    private UserRegistrationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new UserRegistrationServiceImpl(users, passwords, verification, metrics, events);
    }

    private static Registration registration(String email) {
        return new Registration(email, "a-long-password", " Awa ", " Diallo ", null, true, true,
                new Arrival("/ressources", "fr", "Africa/Dakar"));
    }

    @Test
    @DisplayName("a new address becomes an unverified local account and receives its verification email")
    void createsAnAccount() {
        when(passwords.hash("a-long-password")).thenReturn("hash");

        User user = service.register(registration(" Awa@Example.com "));

        User stored = users.stored(user.getId());
        assertThat(stored.getEmail()).isEqualTo("awa@example.com");
        assertThat(stored.getFirstName()).isEqualTo("Awa");
        assertThat(stored.getPasswordHash()).isEqualTo("hash");
        assertThat(stored.isEmailVerified()).isFalse();
        assertThat(stored.isMarketingConsent()).isTrue();
        assertThat(stored.getSignupPath()).isEqualTo("/ressources");
        verify(verification).send(user);
        verify(events).registered(new MemberRegistered("awa@example.com", true));
        verify(metrics).register(true);
    }

    @Test
    @DisplayName("a newsletter-only contact with the same address becomes the account")
    void upgradesANewsletterContact() {
        users.save(User.builder().id(9L).email("awa@example.com").firstName("").lastName("").build());
        when(passwords.hash("a-long-password")).thenReturn("hash");

        User user = service.register(registration("awa@example.com"));

        assertThat(user.getId()).isEqualTo(9L);
        assertThat(users.stored(9L).hasLoginMethod()).isTrue();
        verify(verification).send(user);
    }

    @Test
    @DisplayName("an address that already signs in is refused, and nothing is sent")
    void refusesAnExistingAccount() {
        users.save(User.builder().email("awa@example.com").passwordHash("hash").build());

        assertThatThrownBy(() -> service.register(registration("awa@example.com")))
                .isInstanceOf(BadRequestException.class);
        verify(verification, never()).send(any());
        verify(metrics).register(false);
    }

    @Test
    @DisplayName("a mistyped phone number is refused before anything is saved")
    void checksThePhoneFirst() {
        Registration withBadPhone = new Registration("awa@example.com", "a-long-password", "Awa", "Diallo", "+237 12", null, null, null);

        assertThatThrownBy(() -> service.register(withBadPhone)).isInstanceOf(BadRequestException.class);
        assertThat(users.findByEmail("awa@example.com")).isEmpty();
    }
}
