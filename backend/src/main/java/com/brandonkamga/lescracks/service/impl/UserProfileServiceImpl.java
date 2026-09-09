package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.user.UserPasswordChangeRequest;
import com.brandonkamga.lescracks.dto.user.UserProfileUpdateRequest;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.interfaces.UserProfileService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@Transactional
public class UserProfileServiceImpl implements UserProfileService {
    private final UserRepository users;
    private final PasswordEncoder passwords;

    public UserProfileServiceImpl(UserRepository users, PasswordEncoder passwords) {
        this.users = users;
        this.passwords = passwords;
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
        user.setUpdatedAt(Instant.now());
        return user;
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
