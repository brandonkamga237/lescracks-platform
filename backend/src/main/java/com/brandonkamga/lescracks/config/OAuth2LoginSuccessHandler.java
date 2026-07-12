package com.brandonkamga.lescracks.config;

import com.brandonkamga.lescracks.security.AuthCookieService;
import com.brandonkamga.lescracks.security.jwt.JwtService;
import com.brandonkamga.lescracks.service.interfaces.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

/**
 * Handles successful OAuth2 authentication.
 *
 * Issues the JWT as an HttpOnly cookie and redirects to the frontend callback with
 * no token in the URL at all, so it never lands in browser history, access logs or
 * Referer headers — and JS (including any XSS payload) cannot read it.
 */
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserService userService;
    private final JwtService jwtService;
    private final AuthCookieService authCookieService;
    private final String frontendUrl;

    public OAuth2LoginSuccessHandler(
            UserService userService,
            JwtService jwtService,
            AuthCookieService authCookieService,
            @Value("${app.frontend.url}") String frontendUrl) {
        this.userService       = userService;
        this.jwtService        = jwtService;
        this.authCookieService = authCookieService;
        this.frontendUrl       = frontendUrl;
    }

    public UserService getUserService() {
        return userService;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) {

        OAuth2User oauthUser = extractOAuthUser(authentication);
        String provider      = extractProvider(authentication);

        com.brandonkamga.lescracks.domain.User user =
                userService.processOAuthPostLogin(oauthUser, provider);

        String token = jwtService.generateTokenForUser(user.getEmail());

        // Hand the token to the browser as an HttpOnly cookie rather than in the URL.
        authCookieService.write(response, token);

        sendRedirect(response);
    }

    protected OAuth2User extractOAuthUser(Authentication authentication) {
        if (authentication.getPrincipal() instanceof OAuth2User oauthUser) {
            return oauthUser;
        }
        throw new IllegalStateException("Principal is not an OAuth2User");
    }

    protected String extractProvider(Authentication authentication) {
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            return oauthToken.getAuthorizedClientRegistrationId();
        }
        return authentication.getName();
    }

    protected void sendRedirect(HttpServletResponse response) {
        try {
            // No token in the URL — the browser already holds it in the HttpOnly cookie.
            response.sendRedirect(frontendUrl + "/oauth/callback");
        } catch (Exception e) {
            throw new RuntimeException("Failed to redirect after OAuth login", e);
        }
    }
}
