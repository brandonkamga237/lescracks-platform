package com.brandonkamga.lescracks.config;

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
 * Generates JWT token and redirects user to frontend with token.
 * Follows Single Responsibility Principle - only handles OAuth success.
 */
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserService userService;
    private final JwtService jwtService;
    private final String frontendUrl;

    public OAuth2LoginSuccessHandler(
            UserService userService,
            JwtService jwtService,
            @Value("${app.frontend.url}") String frontendUrl) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.frontendUrl = frontendUrl;
    }

    // Getter for LazyOAuth2SuccessHandler
    public UserService getUserService() {
        return userService;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) {

        OAuth2User oauthUser = extractOAuthUser(authentication);
        String provider = extractProvider(authentication);

        // Process user (create if doesn't exist) — returns the resolved User with correct email
        com.brandonkamga.lescracks.domain.User user =
                userService.processOAuthPostLogin(oauthUser, provider);

        // Generate JWT using the stored email (handles private GitHub emails via fallback)
        String token = jwtService.generateTokenForUser(user.getEmail());

        // Redirect to frontend with token
        sendRedirect(response, token);
    }

    /**
     * Extract OAuth2User from Authentication principal.
     * 
     * @param authentication the Spring Security authentication object
     * @return the OAuth2User
     * @throws IllegalStateException if principal is not OAuth2User
     */
    protected OAuth2User extractOAuthUser(Authentication authentication) {
        if (authentication.getPrincipal() instanceof OAuth2User oauthUser) {
            return oauthUser;
        }
        throw new IllegalStateException("Principal is not OAuth2User");
    }

    /**
     * Extract the OAuth provider name from the authentication.
     * For OAuth2AuthenticationToken, this returns the registration ID (google, github).
     * 
     * @param authentication the Spring Security authentication object
     * @return the provider name (google, github)
     */
    protected String extractProvider(Authentication authentication) {
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            return oauthToken.getAuthorizedClientRegistrationId();
        }
        // Fallback to getName() for backward compatibility
        return authentication.getName();
    }

    /**
     * Send redirect response to frontend with token.
     * Can be overridden for custom redirect behavior.
     * 
     * @param response the HTTP response
     * @param token the JWT token
     */
    protected void sendRedirect(HttpServletResponse response, String token) {
        try {
            response.sendRedirect(frontendUrl + "/oauth/callback?token=" + token);
        } catch (Exception e) {
            throw new RuntimeException("Failed to redirect after OAuth login", e);
        }
    }
}
