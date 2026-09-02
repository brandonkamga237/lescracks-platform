package com.brandonkamga.lescracks.support;

import com.brandonkamga.lescracks.security.KeycloakRoleConverter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

/**
 * Tokens shaped like the ones Keycloak signs, without Keycloak.
 *
 * The authorities come from the production KeycloakRoleConverter rather than from jwt()'s
 * default, which derives them from scopes and would let these tests pass while the real
 * realm_access mapping was broken — the failure mode that once locked every premium user
 * out of premium without a single error.
 */
public final class Tokens {

    private static final KeycloakRoleConverter CONVERTER = new KeycloakRoleConverter();

    private Tokens() {
    }

    public static JwtRequestPostProcessor user() {
        return of("user");
    }

    public static JwtRequestPostProcessor admin() {
        return of("admin");
    }

    /** A signed-in caller Keycloak gave none of our roles to. */
    public static JwtRequestPostProcessor noRole() {
        return of();
    }

    private static JwtRequestPostProcessor of(String... realmRoles) {
        String label = realmRoles.length == 0 ? "anonymous" : String.join("-", realmRoles);
        return jwt()
                .jwt(token -> token
                        .subject("kc-" + label)
                        .claim("email", label + "@lescracks.test")
                        .claim("name", "Test " + label)
                        .claim("realm_access", Map.of("roles", List.of(realmRoles))))
                .authorities(Tokens::authoritiesOf);
    }

    private static Collection<GrantedAuthority> authoritiesOf(Jwt token) {
        return CONVERTER.convert(token).getAuthorities().stream()
                .map(GrantedAuthority.class::cast)
                .toList();
    }
}
