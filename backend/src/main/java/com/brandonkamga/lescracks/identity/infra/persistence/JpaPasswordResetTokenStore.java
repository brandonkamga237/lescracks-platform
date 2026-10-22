package com.brandonkamga.lescracks.identity.infra.persistence;

import com.brandonkamga.lescracks.identity.domain.credential.PasswordResetToken;
import com.brandonkamga.lescracks.identity.domain.credential.PasswordResetTokenStore;

import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
class JpaPasswordResetTokenStore implements PasswordResetTokenStore {

    private final PasswordResetTokenJpaRepository tokens;

    JpaPasswordResetTokenStore(PasswordResetTokenJpaRepository tokens) {
        this.tokens = tokens;
    }

    @Override
    public Optional<PasswordResetToken> findByTokenHash(String tokenHash) {
        return tokens.findByTokenHash(tokenHash).map(JpaPasswordResetTokenStore::toDomain);
    }

    @Override
    public PasswordResetToken save(PasswordResetToken token) {
        PasswordResetTokenEntity entity = token.getId() == null ? new PasswordResetTokenEntity()
                : tokens.findById(token.getId()).orElseThrow(() -> new IllegalStateException("No token " + token.getId() + " to update"));
        entity.setUserId(token.getUserId());
        entity.setTokenHash(token.getTokenHash());
        entity.setExpiresAt(token.getExpiresAt());
        entity.setUsedAt(token.getUsedAt());
        if (entity.getCreatedAt() == null) entity.setCreatedAt(token.getCreatedAt());
        return toDomain(tokens.save(entity));
    }

    private static PasswordResetToken toDomain(PasswordResetTokenEntity entity) {
        return PasswordResetToken.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .tokenHash(entity.getTokenHash())
                .expiresAt(entity.getExpiresAt())
                .usedAt(entity.getUsedAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
