package com.brandonkamga.lescracks.identity.infra.persistence;

import com.brandonkamga.lescracks.identity.domain.admin.Admin;
import com.brandonkamga.lescracks.identity.domain.admin.AdminStore;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
class JpaAdminStore implements AdminStore {

    private final AdminJpaRepository admins;

    JpaAdminStore(AdminJpaRepository admins) {
        this.admins = admins;
    }

    @Override
    public Optional<Admin> findByUsername(String username) {
        return admins.findByUsernameIgnoreCase(username).map(JpaAdminStore::toDomain);
    }

    @Override
    public List<Admin> findAll() {
        return admins.findAll().stream().map(JpaAdminStore::toDomain).toList();
    }

    @Override
    public Admin save(Admin admin) {
        AdminEntity entity = admin.getId() == null ? new AdminEntity()
                : admins.findById(admin.getId()).orElseThrow(() -> new IllegalStateException("No admin " + admin.getId() + " to update"));
        entity.setUsername(admin.getUsername());
        entity.setPasswordHash(admin.getPasswordHash());
        entity.setStatus(admin.getStatus());
        if (entity.getCreatedAt() == null) entity.setCreatedAt(admin.getCreatedAt());
        entity.setUpdatedAt(admin.getUpdatedAt());
        return toDomain(admins.save(entity));
    }

    @Override
    public void deleteById(Long id) {
        admins.deleteById(id);
    }

    private static Admin toDomain(AdminEntity entity) {
        return Admin.builder()
                .id(entity.getId())
                .username(entity.getUsername())
                .passwordHash(entity.getPasswordHash())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
