package com.brandonkamga.lescracks.support;

import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;

import java.util.List;
import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

/**
 * Tokens shaped like the ones Keycloak signs, without Keycloak.
 *
 * The roles sit under realm_access exactly where the converter looks for them, so these
 * exercise the real KeycloakRoleConverter rather than a convenient stand-in.
 */
public final class Tokens {

    private Tokens() {
    }

    public static JwtRequestPostProcessor user() {
        return of("user");
    }

    public static JwtRequestPostProcessor admin() {
        return of("admin");
    }

    private static JwtRequestPostProcessor of(String... realmRoles) {
        String label = String.join("-", realmRoles);
        return jwt().jwt(token -> token
                .subject("kc-" + label)
                .claim("email", label + "@lescracks.test")
                .claim("name", "Test " + label)
                .claim("realm_access", Map.of("roles", List.of(realmRoles))));
    }
}
