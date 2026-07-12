package com.brandonkamga.lescracks.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Issues, reads and clears the HttpOnly cookie that carries the JWT.
 *
 * Holding the token in an HttpOnly cookie rather than localStorage means an XSS
 * flaw anywhere in the app cannot read or exfiltrate it. SameSite=Lax stops the
 * cookie from being attached to cross-site requests, which protects the
 * state-changing endpoints from CSRF while still letting the OAuth redirect land.
 */
@Component
public class AuthCookieService {

    public static final String COOKIE_NAME = "lescracks_token";

    /** False in local dev (plain http), true in production (https). */
    private final boolean secure;
    private final long expirationMs;

    public AuthCookieService(
            @Value("${app.auth.cookie.secure:true}") boolean secure,
            @Value("${app.jwt.expiration:86400000}") long expirationMs) {
        this.secure       = secure;
        this.expirationMs = expirationMs;
    }

    /** Attach the JWT to the response as an HttpOnly cookie. */
    public void write(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofMillis(expirationMs))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /** Expire the auth cookie (logout). */
    public void clear(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /** Read the JWT from the request cookies, or null when absent. */
    public String read(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (COOKIE_NAME.equals(cookie.getName())
                    && cookie.getValue() != null
                    && !cookie.getValue().isBlank()) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
