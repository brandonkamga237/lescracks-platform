package com.brandonkamga.lescracks.identity.infra.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

interface EmailVerificationTokenJpaRepository extends JpaRepository<EmailVerificationTokenEntity, Long> {

    Optional<EmailVerificationTokenEntity> findByTokenHash(String tokenHash);

    Optional<EmailVerificationTokenEntity> findFirstByUserIdOrderByCreatedAtDesc(Long userId);
}
