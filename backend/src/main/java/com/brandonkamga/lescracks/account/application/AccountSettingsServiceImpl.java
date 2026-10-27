package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountDeleting;
import com.brandonkamga.lescracks.account.domain.port.AccountEvents;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.account.domain.port.PasswordHasher;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

public class AccountSettingsServiceImpl implements AccountSettingsService {
    private final AccountStore accounts;
    private final PasswordHasher passwords;
    private final AccountEvents events;

    public AccountSettingsServiceImpl(AccountStore accounts, PasswordHasher passwords, AccountEvents events) {
        this.accounts = accounts;
        this.passwords = passwords;
        this.events = events;
    }

    @Override
    public void changePassword(String email, PasswordChange change) {
        Account account = require(email);
        if (account.getPasswordHash() == null || !passwords.matches(change.currentPassword(), account.getPasswordHash())) {
            throw new BadRequestException("Le mot de passe actuel est incorrect.");
        }
        if (!change.newPassword().equals(change.confirmation())) {
            throw new BadRequestException("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
        }
        account.setPasswordHash(passwords.hash(change.newPassword()));
        accounts.save(account);
    }

    @Override
    public void close(String email) {
        Long id = require(email).getId();
        events.deleting(new AccountDeleting(id));
        accounts.delete(id);
    }

    private Account require(String email) {
        return accounts.findByEmail(email).orElseThrow(() -> new NotFoundException("Utilisateur", "email", email));
    }
}
