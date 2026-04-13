package com.brandonkamga.lescracks.security.oauth;

import com.brandonkamga.lescracks.domain.Provider;
import com.brandonkamga.lescracks.domain.ProviderType;
import com.brandonkamga.lescracks.domain.Role;
import com.brandonkamga.lescracks.domain.User;
import org.springframework.security.oauth2.core.user.OAuth2User;

/**
 * Strategy interface for extracting user information from OAuth2 providers.
 * Follows Open/Closed Principle - new providers can be added without modifying existing code.
 */
public interface OAuthUserInfoExtractor {
    
    /**
     * Get the provider type this extractor handles.
     * @return the provider type
     */
    ProviderType getProviderType();
    
    /**
     * Check if this extractor supports the given provider.
     * @param provider the OAuth provider name
     * @return true if this extractor handles the provider
     */
    boolean supports(String provider);
    
    /**
     * Extract the email from OAuth2 user.
     * @param oauthUser the OAuth2 user object
     * @return the email address
     */
    String extractEmail(OAuth2User oauthUser);
    
    /**
     * Extract the full name from OAuth2 user.
     * @param oauthUser the OAuth2 user object
     * @return the full name
     */
    String extractName(OAuth2User oauthUser);
    
    /**
     * Extract the provider-specific user ID.
     * @param oauthUser the OAuth2 user object
     * @return the provider user ID
     */
    String extractProviderUserId(OAuth2User oauthUser);
    
    /**
     * Extract a unique username from OAuth2 user.
     * @param oauthUser the OAuth2 user object
     * @return the username
     */
    String extractUsername(OAuth2User oauthUser);
    
    /**
     * Build a User entity from OAuth2 user information.
     * @param oauthUser the OAuth2 user object
     * @param role the default role to assign
     * @param provider the provider entity
     * @return a new User entity
     */
    User buildUser(OAuth2User oauthUser, Role role, Provider provider);
    
    /**
     * Extract the profile picture URL from OAuth2 user.
     * @param oauthUser the OAuth2 user object
     * @return the picture URL, or null if not available
     */
    default String extractPictureUrl(OAuth2User oauthUser) {
        return null;
    }

    /**
     * Extract the first name from OAuth2 user.
     * @param oauthUser the OAuth2 user object
     * @return the first name, or null if not available
     */
    default String extractFirstName(OAuth2User oauthUser) {
        return null;
    }
    
    /**
     * Extract the last name from OAuth2 user.
     * @param oauthUser the OAuth2 user object
     * @return the last name, or null if not available
     */
    default String extractLastName(OAuth2User oauthUser) {
        return null;
    }
}
