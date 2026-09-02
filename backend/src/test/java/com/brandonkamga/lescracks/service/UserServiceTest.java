package com.brandonkamga.lescracks.service;

import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.impl.UserServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The join between a Keycloak identity and a local row.
 *
 * Keycloak owns the email and the name, so this only mirrors them. What it must never do is
 * key on the email: an address can change in the realm, and the row has to follow the same
 * person rather than become a second one.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    UserRepository users;

    @InjectMocks
    UserServiceImpl service;

    private static Jwt token(Map<String, Object> claims) {
        Jwt.Builder builder = Jwt.withTokenValue("t").header("alg", "RS256")
                .subject("kc-42")
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(300));
        claims.forEach(builder::claim);
        return builder.build();
    }

    private static User existing() {
        return User.builder().id(1L).subject("kc-42")
                .email("ada@lescracks.test").displayName("Ada Lovelace").build();
    }

    @Test
    @DisplayName("a first sign-in creates the row from the token")
    void createsOnFirstSignIn() {
        when(users.findBySubject("kc-42")).thenReturn(Optional.empty());
        when(users.save(any())).thenAnswer(call -> call.getArgument(0));

        User created = service.fromToken(token(Map.of("email", "ada@lescracks.test", "name", "Ada Lovelace")));

        assertThat(created.getSubject()).isEqualTo("kc-42");
        assertThat(created.getEmail()).isEqualTo("ada@lescracks.test");
        assertThat(created.getDisplayName()).isEqualTo("Ada Lovelace");
        assertThat(created.getLastSeenAt()).isNotNull();
    }

    @Test
    @DisplayName("the row is found by subject, so a changed address still finds the same person")
    void findsBySubjectNotByEmail() {
        when(users.findBySubject("kc-42")).thenReturn(Optional.of(existing()));

        User found = service.fromToken(token(Map.of("email", "ada.new@lescracks.test", "name", "Ada Lovelace")));

        assertThat(found.getId()).isEqualTo(1L);
        verify(users, never()).save(any());
    }

    @Test
    @DisplayName("an address changed in the realm wins here")
    void mirrorsANewAddress() {
        when(users.findBySubject("kc-42")).thenReturn(Optional.of(existing()));

        User refreshed = service.fromToken(token(Map.of("email", "ada.new@lescracks.test", "name", "Ada Lovelace")));

        assertThat(refreshed.getEmail()).isEqualTo("ada.new@lescracks.test");
    }

    @Test
    @DisplayName("a renamed account is mirrored too")
    void mirrorsANewName() {
        when(users.findBySubject("kc-42")).thenReturn(Optional.of(existing()));

        User refreshed = service.fromToken(token(Map.of("email", "ada@lescracks.test", "name", "Ada L.")));

        assertThat(refreshed.getDisplayName()).isEqualTo("Ada L.");
    }

    @Test
    @DisplayName("last seen is stamped on every call, even when nothing else changed")
    void stampsLastSeenEveryTime() {
        User user = existing();
        when(users.findBySubject("kc-42")).thenReturn(Optional.of(user));

        service.fromToken(token(Map.of("email", "ada@lescracks.test", "name", "Ada Lovelace")));

        assertThat(user.getLastSeenAt()).isNotNull();
    }

    @Test
    @DisplayName("a token with no name falls back to the username rather than leaving it blank")
    void fallsBackToThePreferredUsername() {
        when(users.findBySubject("kc-42")).thenReturn(Optional.empty());
        when(users.save(any())).thenAnswer(call -> call.getArgument(0));

        User created = service.fromToken(token(Map.of(
                "email", "ada@lescracks.test", "preferred_username", "ada")));

        assertThat(created.getDisplayName()).isEqualTo("ada");
    }

    @Test
    @DisplayName("a token missing a claim does not blow up")
    void toleratesAMissingClaim() {
        when(users.findBySubject("kc-42")).thenReturn(Optional.empty());
        when(users.save(any())).thenAnswer(call -> call.getArgument(0));

        User created = service.fromToken(token(Map.of()));

        assertThat(created.getEmail()).isNull();
        assertThat(created.getDisplayName()).isNull();
    }

    @Test
    @DisplayName("an unknown id and an unknown subject are both not found")
    void refusesUnknownUsers() {
        when(users.findById(999L)).thenReturn(Optional.empty());
        when(users.findBySubject("kc-inconnu")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.require(999L)).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.requireBySubject("kc-inconnu")).isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("a known id and a known subject both return the row")
    void findsKnownUsers() {
        when(users.findById(1L)).thenReturn(Optional.of(existing()));
        when(users.findBySubject("kc-42")).thenReturn(Optional.of(existing()));

        assertThat(service.require(1L).getId()).isEqualTo(1L);
        assertThat(service.requireBySubject("kc-42").getSubject()).isEqualTo("kc-42");
    }
}
