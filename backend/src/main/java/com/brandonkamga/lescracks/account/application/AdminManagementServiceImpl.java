package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Admin;
import com.brandonkamga.lescracks.account.domain.model.AdminStatus;
import com.brandonkamga.lescracks.account.domain.port.AdminStore;
import com.brandonkamga.lescracks.account.domain.port.PasswordHasher;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import java.time.Instant;
import java.util.List;

public class AdminManagementServiceImpl implements AdminManagementService {

    private final AdminStore admins;
    private final PasswordHasher passwords;

    public AdminManagementServiceImpl(AdminStore admins, PasswordHasher passwords) {
        this.admins = admins;
        this.passwords = passwords;
    }

    @Override
    public List<Admin> list() {
        return admins.findAll();
    }

    @Override
    public Admin create(String username, String password) {
        if (admins.findByUsername(username).isPresent()) {
            throw new BadRequestException("Ce nom d’utilisateur est déjà utilisé.");
        }
        return admins.save(Admin.builder()
                .username(username.trim().toLowerCase())
                .passwordHash(passwords.hash(password))
                .status(AdminStatus.ACTIVE)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());
    }

    @Override
    public void delete(Long id) {
        admins.deleteById(id);
    }
}
