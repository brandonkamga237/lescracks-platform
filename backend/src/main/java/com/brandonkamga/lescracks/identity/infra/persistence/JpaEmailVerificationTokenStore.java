package com.brandonkamga.lescracks.identity.infra.persistence;

import com.brandonkamga.lescracks.identity.domain.signup.EmailVerificationToken;
import com.brandonkamga.lescracks.identity.domain.signup.EmailVerificationTokenStore;

import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
class JpaEmailVerificationTokenStore implements EmailVerificationTokenStore {

    private final EmailVerificationTokenJpaRepository tokens;

    JpaEmailVerificationTokenStore(EmailVerificationTokenJpaRepository tokens) {
        this.tokens = tokens;
    }

    @Override
    public Optional<EmailVerificationToken> findByTokenHash(String tokenHash) {
        return tokens.findByTokenHash(tokenHash).map(JpaEmailVerificationTokenStore::toDomain);
    }

    @Override
    public Optional<EmailVerificationToken> findLatest(Long userId) {
        return tokens.findFirstByUserIdOrderByCreatedAtDesc(userId).map(JpaEmailVerificationTokenStore::toDomain);
    }

    @Override
    public EmailVerificationToken save(EmailVerificationToken token) {
        EmailVerificationTokenEntity entity = token.getId() == null ? new EmailVerificationTokenEntity()
                : tokens.findById(token.getId()).orElseThrow(() -> new IllegalStateException("No token " + token.getId() + " to update"));
        entity.setUserId(token.getUserId());
        entity.setTokenHash(token.getTokenHash());
        entity.setExpiresAt(token.getExpiresAt());
        entity.setUsedAt(token.getUsedAt());
        if (entity.getCreatedAt() == null) entity.setCreatedAt(token.getCreatedAt());
        return toDomain(tokens.save(entity));
    }

    private static EmailVerificationToken toDomain(EmailVerificationTokenEntity entity) {
        return EmailVerificationToken.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .tokenHash(entity.getTokenHash())
                .expiresAt(entity.getExpiresAt())
                .usedAt(entity.getUsedAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
