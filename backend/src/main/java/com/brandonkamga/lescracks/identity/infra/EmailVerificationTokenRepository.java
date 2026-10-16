package com.brandonkamga.lescracks.identity.infra;

import com.brandonkamga.lescracks.identity.domain.EmailVerificationToken;
import com.brandonkamga.lescracks.identity.domain.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    Optional<EmailVerificationToken> findFirstByUserOrderByCreatedAtDesc(User user);
}
