package com.brandonkamga.lescracks.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for JWT token generation and validation.
 * Implements token-based authentication for both OAuth and local users.
 */
@Service
public class JwtService {

    private final String jwtSecret;
    private final long jwtExpiration;

    public JwtService(
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.jwt.expiration}") long jwtExpiration) {
        this.jwtSecret = jwtSecret;
        this.jwtExpiration = jwtExpiration;
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Generate JWT token for OAuth2 authenticated user.
     * 
     * @param authentication the Spring Security authentication
     * @return the JWT token string
     */
    public String generateToken(Authentication authentication) {
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> claims = buildClaims(oauthUser, authentication.getName());
        return createToken(claims, oauthUser.getAttribute("email"));
    }

    /**
     * Generate JWT token for local user authentication.
     * 
     * @param email the user's email
     * @return the JWT token string
     */
    public String generateTokenForUser(String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", email);
        return createToken(claims, email);
    }

    private Map<String, Object> buildClaims(OAuth2User oauthUser, String provider) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", oauthUser.getAttribute("email"));
        claims.put("name", oauthUser.getAttribute("name"));
        claims.put("provider", provider);
        return claims;
    }

    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Extract all claims from a JWT token.
     * 
     * @param token the JWT token
     * @return the claims object
     */
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Extract email from token.
     * 
     * @param token the JWT token
     * @return the email/subject
     */
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    /**
     * Extract expiration date from token.
     * 
     * @param token the JWT token
     * @return the expiration date
     */
    public Date extractExpiration(String token) {
        return extractAllClaims(token).getExpiration();
    }

    /**
     * Check if token is expired.
     * 
     * @param token the JWT token
     * @return true if expired
     */
    public boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Validate a JWT token.
     * 
     * @param token the JWT token
     * @return true if valid
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
