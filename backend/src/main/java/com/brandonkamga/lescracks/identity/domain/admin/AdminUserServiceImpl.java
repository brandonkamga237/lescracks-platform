package com.brandonkamga.lescracks.identity.domain.admin;

import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.identity.domain.member.UserSearch;
import com.brandonkamga.lescracks.identity.domain.member.UserStatus;
import com.brandonkamga.lescracks.identity.domain.member.UserStore;
import com.brandonkamga.lescracks.identity.domain.signup.EmailVerificationService;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.util.List;

public class AdminUserServiceImpl implements AdminUserService {
    private final UserStore users;
    private final EmailVerificationService verification;

    public AdminUserServiceImpl(UserStore users, EmailVerificationService verification) {
        this.users = users;
        this.verification = verification;
    }

    @Override
    public Paged<User> list(UserSearch search, PageQuery page) {
        return users.search(search, page);
    }

    @Override
    public List<User> listAll(UserSearch search) {
        return users.searchAll(search);
    }

    @Override
    public User require(Long id) {
        return users.findById(id).orElseThrow(() -> new NotFoundException("Utilisateur", "id", id));
    }

    @Override
    public User setStatus(Long id, UserStatus status) {
        User user = require(id);
        user.setStatus(status);
        return users.save(user);
    }

    @Override
    public void delete(Long id) { users.delete(require(id).getId()); }

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
        return users.save(user);
    }

    private User requireAccount(Long id) {
        User user = require(id);
        if (!user.hasLoginMethod()) {
            throw new BadRequestException("Ce contact est seulement abonné à la newsletter : il n’a pas de compte à confirmer.");
        }
        return user;
    }
}
