package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.infra.AdminRepository;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

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
