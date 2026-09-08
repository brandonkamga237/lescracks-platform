package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.Admin;
import com.brandonkamga.lescracks.domain.AdminStatus;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.repository.AdminRepository;
import com.brandonkamga.lescracks.service.interfaces.AdminManagementService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class AdminManagementServiceImpl implements AdminManagementService {
    private final AdminRepository admins;
    private final PasswordEncoder passwords;

    public AdminManagementServiceImpl(AdminRepository admins, PasswordEncoder passwords) {
        this.admins = admins;
        this.passwords = passwords;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Admin> list() {
        return admins.findAll();
    }

    @Override
    public Admin create(String username, String password) {
        if (admins.findByUsernameIgnoreCase(username).isPresent()) {
            throw new BadRequestException("Ce nom d’utilisateur est déjà utilisé.");
        }
        return admins.save(Admin.builder()
                .username(username.trim().toLowerCase())
                .passwordHash(passwords.encode(password))
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
