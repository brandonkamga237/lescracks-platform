package com.brandonkamga.lescracks.identity.domain;

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
    public User update(String email, ProfileChanges changes) {
        User user = require(email);
        user.setFirstName(changes.firstName().trim());
        user.setLastName(changes.lastName().trim());
        user.setUsername(changes.username() == null ? null : changes.username().trim().toLowerCase());
        user.setAvatarUrl(changes.avatarUrl() == null ? null : changes.avatarUrl().trim());
        user.setBio(changes.bio() == null ? null : changes.bio().trim());
        user.setLocation(changes.location() == null ? null : changes.location().trim());
        if (changes.socialLinks() != null) {
            user.setSocialLinks(changes.socialLinks());
        }
        MemberProfiles.phone(user, changes.phone());
        if (changes.situation() != null) user.setSituation(changes.situation());
        if (changes.goal() != null) user.setGoal(changes.goal());
        interests(user, changes.interestIds());
        if (changes.marketingConsent() != null) user.setMarketingConsent(changes.marketingConsent());
        user.setUpdatedAt(Instant.now());
        return user;
    }

    @Override
    public User onboard(String email, OnboardingAnswers answers) {
        User user = require(email);
        MemberProfiles.phone(user, answers.phone());
        if (answers.situation() != null) user.setSituation(answers.situation());
        if (answers.goal() != null) user.setGoal(answers.goal());
        interests(user, answers.interestIds());
        if (answers.location() != null && !answers.location().isBlank()) user.setLocation(answers.location().trim());
        if (answers.marketingConsent() != null) user.setMarketingConsent(answers.marketingConsent());
        MemberProfiles.arrival(user, answers.arrival());
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
    public void changePassword(String email, PasswordChange change) {
        User user = require(email);
        if (user.getPasswordHash() == null || !passwords.matches(change.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Le mot de passe actuel est incorrect.");
        }
        if (!change.newPassword().equals(change.confirmation())) {
            throw new BadRequestException("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
        }
        user.setPasswordHash(passwords.encode(change.newPassword()));
    }

    @Override
    public void delete(String email) { users.delete(require(email)); }
}
