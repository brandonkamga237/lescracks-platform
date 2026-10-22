package com.brandonkamga.lescracks.identity.domain.credential;

import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.identity.domain.member.UserStore;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

public class PasswordServiceImpl implements PasswordService {
    private final UserStore users;
    private final PasswordHasher passwords;

    public PasswordServiceImpl(UserStore users, PasswordHasher passwords) {
        this.users = users;
        this.passwords = passwords;
    }

    @Override
    public void change(String email, PasswordChange change) {
        User user = users.findByEmail(email).orElseThrow(() -> new NotFoundException("Utilisateur", "email", email));
        if (user.getPasswordHash() == null || !passwords.matches(change.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Le mot de passe actuel est incorrect.");
        }
        if (!change.newPassword().equals(change.confirmation())) {
            throw new BadRequestException("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
        }
        user.setPasswordHash(passwords.hash(change.newPassword()));
        users.save(user);
    }
}
