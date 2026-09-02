package com.brandonkamga.lescracks.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The place a role name is translated once, so no hasRole() call has to know Keycloak's
 * shape. A mismatch here locked every premium user out of premium in the old codebase, and
 * nothing failed loudly — access was simply, silently refused.
 */
class KeycloakRoleConverterTest {

    private final KeycloakRoleConverter converter = new KeycloakRoleConverter();

    private static Jwt tokenWith(Object realmAccess) {
        Jwt.Builder builder = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .subject("kc-42")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(300));
        if (realmAccess != null) {
            builder.claim("realm_access", realmAccess);
        } else {
            builder.claim("email", "a@b.c");
        }
        return builder.build();
    }

    private List<String> authoritiesOf(Object realmAccess) {
        return converter.convert(tokenWith(realmAccess)).getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
    }

    @Test
    @DisplayName("realm roles become the ROLE_ upper-case authorities hasRole expects")
    void mapsRealmRolesToSpringAuthorities() {
        assertThat(authoritiesOf(Map.of("roles", List.of("admin", "user"))))
                .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_USER");
    }

    @Test
    @DisplayName("Keycloak's own housekeeping roles are dropped")
    void ignoresRolesThatAreNotOurs() {
        assertThat(authoritiesOf(Map.of("roles",
                List.of("user", "offline_access", "uma_authorization", "default-roles-lescracks"))))
                .containsExactly("ROLE_USER");
    }

    @Test
    @DisplayName("a token with no realm_access yields no authority instead of failing")
    void toleratesAMissingClaim() {
        assertThat(authoritiesOf(null)).isEmpty();
    }

    @Test
    @DisplayName("a realm_access without roles yields no authority")
    void toleratesAClaimWithoutRoles() {
        assertThat(authoritiesOf(Map.of())).isEmpty();
    }

    @Test
    @DisplayName("the subject is what identifies the caller, not the email")
    void carriesTheSubjectAsPrincipal() {
        assertThat(converter.convert(tokenWith(Map.of("roles", List.of("user")))).getName())
                .isEqualTo("kc-42");
    }

    @Test
    @DisplayName("the token itself stays available for the claims services read")
    void keepsTheTokenAsCredentials() {
        assertThat(converter.convert(tokenWith(Map.of("roles", List.of("user")))).getCredentials())
                .isInstanceOf(Jwt.class);
    }
}
