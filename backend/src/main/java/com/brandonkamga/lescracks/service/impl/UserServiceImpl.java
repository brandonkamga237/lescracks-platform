package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.Provider;
import com.brandonkamga.lescracks.domain.ProviderType;
import com.brandonkamga.lescracks.domain.Role;
import com.brandonkamga.lescracks.domain.RoleName;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.repository.ProviderRepository;
import com.brandonkamga.lescracks.repository.RoleRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.security.oauth.OAuthUserInfoExtractor;
import com.brandonkamga.lescracks.security.oauth.OAuthUserInfoExtractorFactory;
import com.brandonkamga.lescracks.service.interfaces.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of UserService.
 * Follows Single Responsibility Principle.
 */
@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ProviderRepository providerRepository;
    private final OAuthUserInfoExtractorFactory extractorFactory;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(
            UserRepository userRepository,
            RoleRepository roleRepository,
            ProviderRepository providerRepository,
            OAuthUserInfoExtractorFactory extractorFactory,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.providerRepository = providerRepository;
        this.extractorFactory = extractorFactory;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Process OAuth2 login by extracting user info and creating/finding user.
     * Uses Strategy Pattern via OAuthUserInfoExtractor.
     * 
     * @param oauthUser the OAuth2 user from the provider
     * @param provider the OAuth provider name (google, github, etc.)
     * @return the existing or newly created User
     */
    @Override
    public User processOAuthPostLogin(OAuth2User oauthUser, String provider) {
        OAuthUserInfoExtractor extractor = extractorFactory.getExtractor(provider);
        
        String email = extractor.extractEmail(oauthUser);
        if (email == null) {
            throw new RuntimeException("Email not provided by " + provider);
        }

        // Get or create provider entity
        ProviderType providerType = extractor.getProviderType();
        Provider providerEntity = providerRepository.findByProviderName(providerType)
                .orElseGet(() -> providerRepository.save(Provider.builder()
                        .providerName(providerType)
                        .description(providerType.name() + " OAuth authentication")
                        .build()));

        return userRepository.findByEmail(email)
                .map(existingUser -> {
                    // Update existing user's data from provider
                    updateOAuthUserFromProvider(existingUser, oauthUser, extractor);
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    Role userRole = roleRepository.findByName(RoleName.user)
                            .orElseThrow(() -> new RuntimeException("USER ROLE not found"));
                    User newUser = extractor.buildUser(oauthUser, userRole, providerEntity);
                    return userRepository.save(newUser);
                });
    }

    /**
     * Update existing OAuth user's data from the provider.
     * This ensures user info stays synced with the OAuth provider.
     * 
     * @param existingUser the existing user in the database
     * @param oauthUser the OAuth2 user from the provider
     * @param extractor the OAuth user info extractor
     */
    private void updateOAuthUserFromProvider(User existingUser, OAuth2User oauthUser, OAuthUserInfoExtractor extractor) {
        String username = extractor.extractUsername(oauthUser);
        if (username != null && !username.isEmpty()) {
            existingUser.setUsername(username);
        }
        // Refresh the OAuth picture URL on every login
        String pictureUrl = extractor.extractPictureUrl(oauthUser);
        if (pictureUrl != null && !pictureUrl.isEmpty()) {
            existingUser.setPictureUrl(pictureUrl);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByIdOptional(Long id) {
        return userRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Override
    public User save(User user) {
        return userRepository.save(user);
    }

    @Override
    public void deleteById(Long id) {
        userRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return userRepository.findByUsername(username).isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmailExcept(Long id, String email) {
        Optional<User> user = userRepository.findByEmail(email);
        return user.isPresent() && !user.get().getId().equals(id);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByUsernameExcept(Long id, String username) {
        Optional<User> user = userRepository.findByUsername(username);
        return user.isPresent() && !user.get().getId().equals(id);
    }

    @Override
    public boolean verifyPassword(User user, String currentPassword) {
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            return false;
        }
        return passwordEncoder.matches(currentPassword, user.getPassword());
    }

    @Override
    public User updatePassword(User user, String newPassword) {
        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }
}
