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
 *
 * Generates a JWT token and redirects the user to the frontend using a URL
 * fragment (#token=...) so the token is never sent to the server in logs or
 * in the Referer header of subsequent navigations.
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
        this.userService  = userService;
        this.jwtService   = jwtService;
        this.frontendUrl  = frontendUrl;
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

        // Use URL fragment (#) so the token is never included in server access logs
        // or forwarded in Referer headers when the user navigates to other pages.
        sendRedirect(response, token);
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

    protected void sendRedirect(HttpServletResponse response, String token) {
        try {
            // Fragment (#) is never sent to the server and never appears in logs
            response.sendRedirect(frontendUrl + "/oauth/callback#token=" + token);
        } catch (Exception e) {
            throw new RuntimeException("Failed to redirect after OAuth login", e);
        }
    }
}
