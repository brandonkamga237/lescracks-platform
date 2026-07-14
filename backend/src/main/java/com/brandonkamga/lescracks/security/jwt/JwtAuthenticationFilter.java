package com.brandonkamga.lescracks.security.jwt;

import com.brandonkamga.lescracks.security.AuthCookieService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.repository.UserRepository;

import java.io.IOException;

/**
 * Stateless JWT authentication filter.
 *
 * Extracts the Bearer token from the {@code Authorization} header, validates its
 * signature and expiration, checks the {@link JwtTokenBlacklist} (for logged-out
 * tokens), then populates the {@link SecurityContextHolder}.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final JwtTokenBlacklist tokenBlacklist;
    private final UserRepository userRepository;
    private final AuthCookieService authCookieService;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserDetailsService userDetailsService,
            JwtTokenBlacklist tokenBlacklist,
            AuthCookieService authCookieService,
            UserRepository userRepository) {
        this.jwtService         = jwtService;
        this.userDetailsService = userDetailsService;
        this.tokenBlacklist     = tokenBlacklist;
        this.authCookieService  = authCookieService;
        this.userRepository     = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        final String jwt = resolveToken(request);

        if (jwt == null || jwt.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            if (!jwtService.validateToken(jwt)) {
                filterChain.doFilter(request, response);
                return;
            }

            final String jti = jwtService.extractJti(jwt);
            if (jti != null && tokenBlacklist.isRevoked(jti)) {
                log.debug("Rejected revoked token jti={}", jti);
                filterChain.doFilter(request, response);
                return;
            }

            final String userEmail = jwtService.extractEmail(jwt);

            // A password change must end EVERY session, including one an attacker is
            // holding. Tokens are stateless and we keep no list of them, so instead of
            // hunting them down we compare this token's issue time against the moment the
            // user last changed their credentials: anything older is dead.
            if (userEmail != null && isIssuedBeforeCredentialsChange(jwt, userEmail)) {
                log.debug("Rejected token issued before the password was changed for {}", userEmail);
                filterChain.doFilter(request, response);
                return;
            }

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }

        } catch (Exception e) {
            log.debug("JWT authentication failed: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * The browser app authenticates with the HttpOnly cookie; API clients (Swagger,
     * scripts) may still send a Bearer token. The header wins when both are present.
     */
    private String resolveToken(HttpServletRequest request) {
        final String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return authCookieService.read(request);
    }

    /**
     * True when this token predates the user's last credential change.
     *
     * A missing cut-off (null) means the user has never changed their password, so
     * nothing is revoked — deploying this must not log the whole platform out.
     */
    private boolean isIssuedBeforeCredentialsChange(String jwt, String email) {
        return userRepository.findByEmail(email)
                .map(User::getCredentialsChangedAt)
                .map(changedAt -> {
                    java.util.Date issuedAt = jwtService.extractIssuedAt(jwt);
                    if (issuedAt == null) return false;
                    java.time.LocalDateTime issued = java.time.LocalDateTime.ofInstant(
                            issuedAt.toInstant(), java.time.ZoneId.systemDefault());
                    // JWT iat has second precision; truncate so a token minted in the same
                    // second as the change isn't killed by sub-second rounding.
                    return issued.isBefore(changedAt.truncatedTo(java.time.temporal.ChronoUnit.SECONDS));
                })
                .orElse(false);
    }
}
