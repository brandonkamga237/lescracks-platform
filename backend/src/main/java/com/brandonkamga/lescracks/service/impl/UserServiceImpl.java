package com.brandonkamga.lescracks.service.impl;

import java.time.LocalDateTime;
import com.brandonkamga.lescracks.domain.Provider;
import com.brandonkamga.lescracks.domain.ProviderType;
import com.brandonkamga.lescracks.domain.Role;
import com.brandonkamga.lescracks.domain.RoleName;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.exception.OAuthProviderConflictException;
import com.brandonkamga.lescracks.repository.ProviderRepository;
import com.brandonkamga.lescracks.repository.RoleRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.security.oauth.OAuthUserInfoExtractor;
import com.brandonkamga.lescracks.security.oauth.OAuthUserInfoExtractorFactory;
import com.brandonkamga.lescracks.service.interfaces.UserService;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

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
        this.userRepository    = userRepository;
        this.roleRepository    = roleRepository;
        this.providerRepository = providerRepository;
        this.extractorFactory  = extractorFactory;
        this.passwordEncoder   = passwordEncoder;
    }

    /**
     * Process an OAuth2 login: create a new user or update an existing one.
     *
     * Security: if an account already exists with the same email but was created via a
     * different provider (e.g. LOCAL), the login is rejected with
     * {@link OAuthProviderConflictException} to prevent provider-based account takeover.
     */
    @Override
    public User processOAuthPostLogin(OAuth2User oauthUser, String provider) {
        OAuthUserInfoExtractor extractor = extractorFactory.getExtractor(provider);

        String email = extractor.extractEmail(oauthUser);
        if (email == null) {
            throw new RuntimeException("Email not provided by OAuth provider: " + provider);
        }

        ProviderType providerType = extractor.getProviderType();
        Provider providerEntity   = providerRepository.findByProviderName(providerType)
                .orElseGet(() -> providerRepository.save(Provider.builder()
                        .providerName(providerType)
                        .description(providerType.name() + " OAuth authentication")
                        .build()));

        return userRepository.findByEmail(email)
                .map(existingUser -> {
                    // Reject logins that would merge accounts from different providers
                    if (existingUser.getProvider() != null
                            && existingUser.getProvider().getProviderName() != providerType) {
                        throw new OAuthProviderConflictException(
                                "An account with this email already exists. "
                                + "Please sign in using "
                                + existingUser.getProvider().getProviderName().name()
                                + ".");
                    }
                    updateOAuthUserFromProvider(existingUser, oauthUser, extractor);
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    Role userRole = roleRepository.findByName(RoleName.user)
                            .orElseThrow(() -> new RuntimeException("Role 'user' not found"));
                    User newUser  = extractor.buildUser(oauthUser, userRole, providerEntity);
                    return userRepository.save(newUser);
                });
    }

    /**
     * Sync mutable fields from the OAuth provider on each login.
     * Username is only updated when the new value is not already taken by another account.
     */
    private void updateOAuthUserFromProvider(
            User existingUser, OAuth2User oauthUser, OAuthUserInfoExtractor extractor) {

        String newUsername = extractor.extractUsername(oauthUser);
        if (newUsername != null && !newUsername.isEmpty()
                && !newUsername.equals(existingUser.getUsername())) {
            // Only update if the new username is available
            boolean taken = userRepository.findByUsername(newUsername)
                    .map(u -> !u.getId().equals(existingUser.getId()))
                    .orElse(false);
            if (!taken) {
                existingUser.setUsername(newUsername);
            }
        }

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

    /**
     * Change the password AND end every session that was open with the old one.
     *
     * The cut-off is stamped here rather than in the controllers because both the
     * "forgot password" reset and the "change my password" screen funnel through this
     * one method. Put it in the callers and the next person to add a third path forgets,
     * and the hole comes back silently.
     *
     * Why a timestamp and not a token purge: JWTs are stateless, we hold no list of the
     * ones we've handed out. But each carries its issue time, so recording WHEN the
     * password changed lets the filter reject everything older — every session dies on a
     * single write, including the one an attacker is sitting on.
     */
    @Override
    public User updatePassword(User user, String newPassword) {
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setCredentialsChangedAt(LocalDateTime.now());
        return userRepository.save(user);
    }
}
