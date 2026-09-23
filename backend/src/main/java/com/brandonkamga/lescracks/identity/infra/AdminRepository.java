package com.brandonkamga.lescracks.identity.infra;

import com.brandonkamga.lescracks.identity.domain.Admin;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByUsernameIgnoreCase(String username);
}