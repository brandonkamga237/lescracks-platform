package com.brandonkamga.lescracks.identity.infra.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

interface AdminJpaRepository extends JpaRepository<AdminEntity, Long> {

    Optional<AdminEntity> findByUsernameIgnoreCase(String username);
}
