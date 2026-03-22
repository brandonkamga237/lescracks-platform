package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.List;
import java.util.Optional;

/**
 * Service interface for User operations.
 * Follows Interface Segregation Principle.
 */
public interface UserService {

    /**
     * Process OAuth2 login by extracting user info and creating/finding user.
     * Uses Strategy Pattern via OAuthUserInfoExtractor.
     *
     * @param oauthUser the OAuth2 user from the provider
     * @param provider the OAuth provider name (google, github, etc.)
     * @return the existing or newly created User
     */
    User processOAuthPostLogin(OAuth2User oauthUser, String provider);

    /**
     * Find a user by email.
     *
     * @param email the user email
     * @return the user if found
     */
    User findByEmail(String email);

    /**
     * Find a user by ID.
     *
     * @param id the user ID
     * @return the user if found
     */
    User findById(Long id);

    /**
     * Find a user by ID as Optional.
     *
     * @param id the user ID
     * @return Optional containing the user if found
     */
    Optional<User> findByIdOptional(Long id);

    /**
     * Find all users.
     *
     * @return list of all users
     */
    List<User> findAll();

    /**
     * Save a user.
     *
     * @param user the user to save
     * @return the saved user
     */
    User save(User user);

    /**
     * Delete a user by ID.
     *
     * @param id the user ID
     */
    void deleteById(Long id);

    /**
     * Check if a user exists by email.
     *
     * @param email the user email
     * @return true if exists, false otherwise
     */
    boolean existsByEmail(String email);

    /**
     * Check if a user exists by username.
     *
     * @param username the username
     * @return true if exists, false otherwise
     */
    boolean existsByUsername(String username);

    /**
     * Check if a user exists by email, excluding a specific user.
     *
     * @param id the user ID to exclude
     * @param email the user email
     * @return true if exists, false otherwise
     */
    boolean existsByEmailExcept(Long id, String email);

    /**
     * Check if a user exists by username, excluding a specific user.
     *
     * @param id the user ID to exclude
     * @param username the username
     * @return true if exists, false otherwise
     */
    boolean existsByUsernameExcept(Long id, String username);

    /**
     * Verify if the current password matches the user's password.
     *
     * @param user the user
     * @param currentPassword the password to verify
     * @return true if password matches, false otherwise
     */
    boolean verifyPassword(User user, String currentPassword);

    /**
     * Update user's password.
     *
     * @param user the user
     * @param newPassword the new password (already encoded)
     * @return the updated user
     */
    User updatePassword(User user, String newPassword);
}
