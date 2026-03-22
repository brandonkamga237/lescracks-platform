package com.brandonkamga.lescracks.security.oauth;

import com.brandonkamga.lescracks.domain.Provider;
import com.brandonkamga.lescracks.domain.ProviderType;
import com.brandonkamga.lescracks.domain.Role;
import com.brandonkamga.lescracks.domain.User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * GitHub OAuth2 user info extractor implementation.
 * Extracts user information specific to GitHub's OAuth2 response format.
 */
@Component
public class GitHubOAuthUserInfoExtractor implements OAuthUserInfoExtractor {

    @Override
    public ProviderType getProviderType() {
        return ProviderType.GITHUB;
    }

    @Override
    public boolean supports(String provider) {
        return "GITHUB".equalsIgnoreCase(provider);
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
        // Handle GitHub's user ID which can be Integer or Long
        Map<String, Object> attributes = oauthUser.getAttributes();
        Object id = attributes.get("id");
        if (id == null) {
            return null;
        }
        return id.toString();
    }

    @Override
    public String extractUsername(OAuth2User oauthUser) {
        return oauthUser.getAttribute("login");
    }

    @Override
    public String extractFirstName(OAuth2User oauthUser) {
        String name = extractName(oauthUser);
        if (name == null) {
            return null;
        }
        String[] parts = name.split(" ");
        return parts.length > 0 ? parts[0] : name;
    }

    @Override
    public String extractLastName(OAuth2User oauthUser) {
        String name = extractName(oauthUser);
        if (name == null) {
            return null;
        }
        String[] parts = name.split(" ");
        return parts.length > 1 ? parts[1] : null;
    }

    @Override
    public User buildUser(OAuth2User oauthUser, Role role, Provider provider) {

        String email = extractEmail(oauthUser);
        String providerUserId = extractProviderUserId(oauthUser);
        String username = extractUsername(oauthUser);

        if (providerUserId == null) {
            throw new IllegalStateException("GitHub ID not found");
        }

        if (email == null) {
            email = providerUserId + "@github.local";
        }

        if (username == null) {
            username = email.split("@")[0];
        }

        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setRole(role);
        user.setProvider(provider);
        user.setProviderUserId(providerUserId);
        // OAuth users don't have a password
        user.setPassword(null);

        return user;
    }

}
