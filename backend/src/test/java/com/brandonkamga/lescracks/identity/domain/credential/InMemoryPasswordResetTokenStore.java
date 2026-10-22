package com.brandonkamga.lescracks.identity.domain.credential;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

/** Keeps copies, so a token marked used but never saved is still usable here, as in the database. */
class InMemoryPasswordResetTokenStore implements PasswordResetTokenStore {

    private final Map<Long, PasswordResetToken> rows = new HashMap<>();
    private final AtomicLong ids = new AtomicLong();

    @Override
    public Optional<PasswordResetToken> findByTokenHash(String tokenHash) {
        return rows.values().stream().filter(token -> token.getTokenHash().equals(tokenHash)).findFirst().map(this::copy);
    }

    @Override
    public PasswordResetToken save(PasswordResetToken token) {
        PasswordResetToken row = copy(token);
        if (row.getId() == null) row.setId(ids.incrementAndGet());
        rows.put(row.getId(), row);
        return copy(row);
    }

    private PasswordResetToken copy(PasswordResetToken token) {
        return new PasswordResetToken(token.getId(), token.getUserId(), token.getTokenHash(), token.getExpiresAt(),
                token.getUsedAt(), token.getCreatedAt());
    }
}
