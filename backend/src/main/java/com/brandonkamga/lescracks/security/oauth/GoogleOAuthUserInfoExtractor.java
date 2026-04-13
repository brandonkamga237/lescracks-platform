package com.brandonkamga.lescracks.security.oauth;

import com.brandonkamga.lescracks.domain.Provider;
import com.brandonkamga.lescracks.domain.ProviderType;
import com.brandonkamga.lescracks.domain.Role;
import com.brandonkamga.lescracks.domain.User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

/**
 * Google OAuth2 user info extractor implementation.
 * Extracts user information specific to Google's OAuth2 response format.
 */
@Component
public class GoogleOAuthUserInfoExtractor implements OAuthUserInfoExtractor {

    @Override
    public ProviderType getProviderType() {
        return ProviderType.GOOGLE;
    }

    @Override
    public boolean supports(String provider) {
        return "GOOGLE".equalsIgnoreCase(provider);
    }

    @Override
    public String extractEmail(OAuth2User oauthUser) {
        return oauthUser.getAttribute("email");
    }

    @Override
    public String extractName(OAuth2User oauthUser) {
        return oauthUser.getAttribute("name");
    }

    @Override
    public String extractProviderUserId(OAuth2User oauthUser) {
        return oauthUser.getAttribute("sub");
    }

    @Override
    public String extractUsername(OAuth2User oauthUser) {
        String email = oauthUser.getAttribute("email");
        return email != null ? email.split("@")[0] : oauthUser.getAttribute("sub");
    }

    @Override
    public String extractPictureUrl(OAuth2User oauthUser) {
        return oauthUser.getAttribute("picture");
    }

    @Override
    public String extractFirstName(OAuth2User oauthUser) {
        return oauthUser.getAttribute("given_name");
    }

    @Override
    public String extractLastName(OAuth2User oauthUser) {
        return oauthUser.getAttribute("family_name");
    }

    @Override
    public User buildUser(OAuth2User oauthUser, Role role, Provider provider) {

        String email = extractEmail(oauthUser);
        String username = extractUsername(oauthUser);
        String providerUserId = extractProviderUserId(oauthUser);

        if (username == null && email != null) {
            username = email.split("@")[0];
        }

        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setRole(role);
        user.setProvider(provider);
        user.setProviderUserId(providerUserId);
        user.setPassword(null);
        // Email already verified by Google
        user.setEmailVerified(true);

        return user;
    }

}
