package com.brandonkamga.lescracks.identity.infra;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;

/**
 * Stamps users.last_seen_at on authenticated member requests. The update is
 * conditional and self-throttling: one row write per member per hour, and it
 * never blocks or fails the request it rode along with.
 */
public class LastSeenFilter extends OncePerRequestFilter {
    private static final Duration STALE_AFTER = Duration.ofHours(1);
    private static final Logger log = LoggerFactory.getLogger(LastSeenFilter.class);

    private final UserRepository users;

    public LastSeenFilter(UserRepository users) {
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)) {
            String email = emailOf(authentication);
            if (email != null) {
                try {
                    Instant now = Instant.now();
                    users.touchLastSeen(email, now, now.minus(STALE_AFTER));
                } catch (Exception exception) {
                    log.debug("last_seen touch skipped: {}", exception.getMessage());
                }
            }
        }
        chain.doFilter(request, response);
    }

    private String emailOf(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            return email != null && email.contains("@") ? email : null;
        }
        if (principal instanceof String name && name.contains("@")) {
            return name;
        }
        return null;
    }
}
