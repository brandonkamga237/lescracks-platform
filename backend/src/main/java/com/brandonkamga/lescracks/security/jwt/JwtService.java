package com.brandonkamga.lescracks.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * JWT generation and validation service.
 *
 * Every token includes a unique {@code jti} (JWT ID) claim so that individual
 * tokens can be revoked via {@link JwtTokenBlacklist} without invalidating all
 * tokens for the same user.
 */
@Service
public class JwtService {

    private static final String CLAIM_JTI = "jti";

    private final String jwtSecret;
    private final long jwtExpiration;

    public JwtService(
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.jwt.expiration}") long jwtExpiration) {
        this.jwtSecret    = jwtSecret;
        this.jwtExpiration = jwtExpiration;
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Generate a JWT token for a locally authenticated user.
     *
     * @param email the user's email (used as subject)
     * @return signed JWT string
     */
    public String generateTokenForUser(String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", email);
        return createToken(claims, email);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        Date now        = new Date();
        Date expiration = new Date(now.getTime() + jwtExpiration);
        String jti      = UUID.randomUUID().toString();

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .id(jti)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(getSigningKey())
                .compact();
    }

    /** Extract all claims from a signed JWT. Throws if the token is malformed or expired. */
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** Extract the subject (email) from a token. */
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    /** Extract the unique token ID (jti) claim. */
    public String extractJti(String token) {
        return extractAllClaims(token).getId();
    }

    /** Extract the absolute expiration date of a token. */
    public Date extractExpiration(String token) {
        return extractAllClaims(token).getExpiration();
    }

    /** Returns true if the token's expiration date is in the past. */
    public boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Validate signature and expiration only.
     * Revocation is checked separately by {@link JwtAuthenticationFilter}
     * via {@link JwtTokenBlacklist}.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
}
