package com.brandonkamga.lescracks.identity.infra.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

interface PasswordResetTokenJpaRepository extends JpaRepository<PasswordResetTokenEntity, Long> {

    Optional<PasswordResetTokenEntity> findByTokenHash(String tokenHash);
}
