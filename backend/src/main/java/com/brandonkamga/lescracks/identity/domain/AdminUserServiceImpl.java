package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;
import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.identity.infra.UserSpecifications;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AdminUserServiceImpl implements AdminUserService {
    private final UserRepository users;
    private final EmailVerificationService verification;

    public AdminUserServiceImpl(UserRepository users, EmailVerificationService verification) {
        this.users = users;
        this.verification = verification;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<User> list(UserSearch search, Pageable pageable) {
        return users.findAll(UserSpecifications.matching(search), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public User require(Long id) {
        return users.findById(id).orElseThrow(() -> new NotFoundException("Utilisateur", "id", id));
    }

    @Override
    public User setStatus(Long id, UserStatus status) {
        User user = require(id);
        user.setStatus(status);
        return user;
    }

    @Override
    public void delete(Long id) { users.delete(require(id)); }

    @Override
    public void resendVerification(Long id) {
        User user = requireAccount(id);
        if (user.isEmailVerified()) throw new ConflictException("Cette adresse est déjà confirmée.");
        verification.send(user);
    }

    @Override
    public User markVerified(Long id) {
        User user = requireAccount(id);
        user.setEmailVerified(true);
        return user;
    }

    private User requireAccount(Long id) {
        User user = require(id);
        if (!user.hasLoginMethod()) {
            throw new BadRequestException("Ce contact est seulement abonné à la newsletter : il n’a pas de compte à confirmer.");
        }
        return user;
    }
}