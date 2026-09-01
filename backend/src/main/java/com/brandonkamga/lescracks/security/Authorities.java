package com.brandonkamga.lescracks.security;

import com.brandonkamga.lescracks.domain.RoleName;
import org.springframework.security.core.Authentication;

import java.util.Locale;
import java.util.Set;

/**
 * Single source of truth for the granted authority strings.
 *
 * Authorities are derived from {@link RoleName} as {@code "ROLE_" + name().toUpperCase()}, so a
 * lowercase literal such as {@code "ROLE_learner"} never matches anything. Comparing against these
 * constants, or building them through {@link #of(RoleName)}, keeps that mistake out of reach.
 */
public final class Authorities {

    public static final String USER = of(RoleName.user);
    public static final String PREMIUM_USER = of(RoleName.premium_user);
    public static final String LEARNER = of(RoleName.learner);
    public static final String ADMIN = of(RoleName.admin);

    /** Roles allowed to open premium resources. */
    private static final Set<String> PREMIUM_ACCESS = Set.of(PREMIUM_USER, LEARNER, ADMIN);

    private Authorities() {
    }

    public static String of(RoleName role) {
        return "ROLE_" + role.name().toUpperCase(Locale.ROOT);
    }

    public static boolean has(Authentication authentication, String authority) {
        return authentication != null
                && authentication.isAuthenticated()
                && authentication.getAuthorities().stream()
                        .anyMatch(granted -> granted.getAuthority().equals(authority));
    }

    public static boolean isAdmin(Authentication authentication) {
        return has(authentication, ADMIN);
    }

    /**
     * Premium users keep access until the scheduler downgrades them at expiry; learners and admins
     * always have it.
     */
    public static boolean hasPremiumAccess(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && authentication.getAuthorities().stream()
                        .anyMatch(granted -> PREMIUM_ACCESS.contains(granted.getAuthority()));
    }
}
