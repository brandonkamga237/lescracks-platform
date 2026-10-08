package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.api.dto.OnboardingRequest;
import com.brandonkamga.lescracks.identity.api.dto.UserPasswordChangeRequest;
import com.brandonkamga.lescracks.identity.api.dto.UserProfileUpdateRequest;
import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.storage.domain.StorageService;
import com.brandonkamga.lescracks.taxonomy.domain.TaxonomyService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
@Transactional
public class UserProfileServiceImpl implements UserProfileService {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final StorageService storage;
    private final TaxonomyService taxonomy;

    public UserProfileServiceImpl(UserRepository users, PasswordEncoder passwords, StorageService storage, TaxonomyService taxonomy) {
        this.users = users;
        this.passwords = passwords;
        this.storage = storage;
        this.taxonomy = taxonomy;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> find(String email) {
        return users.findByEmailIgnoreCase(email);
    }

    @Override
    @Transactional(readOnly = true)
    public User require(String email) {
        return users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("Utilisateur", "email", email));
    }

    @Override
    public User update(String email, UserProfileUpdateRequest request) {
        User user = require(email);
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setUsername(request.username() == null ? null : request.username().trim().toLowerCase());
        user.setAvatarUrl(request.avatarUrl() == null ? null : request.avatarUrl().trim());
        user.setBio(request.bio() == null ? null : request.bio().trim());
        user.setLocation(request.location() == null ? null : request.location().trim());
        if (request.socialLinks() != null) {
            user.setSocialLinks(request.socialLinks());
        }
        MemberProfiles.phone(user, request.phone());
        if (request.situation() != null) user.setSituation(request.situation());
        if (request.goal() != null) user.setGoal(request.goal());
        interests(user, request.interestIds());
        if (request.marketingConsent() != null) user.setMarketingConsent(request.marketingConsent());
        user.setUpdatedAt(Instant.now());
        return user;
    }

    @Override
    public User onboard(String email, OnboardingRequest request) {
        User user = require(email);
        MemberProfiles.phone(user, request.phone());
        if (request.situation() != null) user.setSituation(request.situation());
        if (request.goal() != null) user.setGoal(request.goal());
        interests(user, request.interestIds());
        if (request.location() != null && !request.location().isBlank()) user.setLocation(request.location().trim());
        if (request.marketingConsent() != null) user.setMarketingConsent(request.marketingConsent());
        MemberProfiles.context(user, request.context());
        if (user.getOnboardedAt() == null) user.setOnboardedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        return user;
    }

    /** Null leaves them as they are; each id must be an existing category. */
    private void interests(User user, Set<Long> ids) {
        if (ids == null) return;
        Set<Long> checked = new HashSet<>();
        for (Long id : ids) {
            checked.add(taxonomy.requireCategory(id).getId());
        }
        user.getInterests().clear();
        user.getInterests().addAll(checked);
    }

    @Override
    public User updateAvatar(String email, MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Aucun fichier reçu.");
        }
        User user = require(email);
        try {
            String key = storage.store(file.getOriginalFilename(), file.getBytes(), file.getContentType());
            user.setAvatarUrl(key);
            user.setUpdatedAt(Instant.now());
            return user;
        } catch (IOException cause) {
            throw new BadRequestException("Impossible de lire le fichier.");
        }
    }

    @Override
    public void changePassword(String email, UserPasswordChangeRequest request) {
        User user = require(email);
        if (user.getPasswordHash() == null || !passwords.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Le mot de passe actuel est incorrect.");
        }
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadRequestException("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
        }
        user.setPasswordHash(passwords.encode(request.newPassword()));
    }

    @Override
    public void delete(String email) { users.delete(require(email)); }
}
