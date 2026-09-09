package com.brandonkamga.lescracks.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Turns the realm roles Keycloak puts in the token into Spring authorities.
 *
 * Keycloak nests them under `realm_access.roles`, and Spring expects a `ROLE_` prefix in
 * upper case. Doing the mapping once here is what keeps every `hasRole` in the codebase from
 * having to know either of those details — the mismatch that broke premium access before.
 */
@Component
public class KeycloakRoleConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private static final Set<String> KNOWN_ROLES = Set.of("user", "admin");

    @Override
    @SuppressWarnings("unchecked")
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        Collection<String> roles = realmAccess == null
                ? List.of()
                : (Collection<String>) realmAccess.getOrDefault("roles", List.of());

        // Keycloak ships its own housekeeping roles in the same claim; only ours mean anything.
        List<GrantedAuthority> authorities = roles.stream()
                .filter(KNOWN_ROLES::contains)
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase(Locale.ROOT)))
                .collect(Collectors.toList());

        // Use the email as the principal so controllers can look users up by getName().
        // JwtAuthenticationToken keeps the raw Jwt intact even after ProviderManager clears credentials.
        String name = jwt.getClaimAsString("email");
        if (name == null || name.isBlank()) {
            name = jwt.getSubject();
        }
        return new JwtAuthenticationToken(jwt, authorities, name);
    }
}
