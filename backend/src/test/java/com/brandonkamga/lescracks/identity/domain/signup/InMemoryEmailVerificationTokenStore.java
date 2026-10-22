package com.brandonkamga.lescracks.identity.domain.signup;

import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

/** Keeps copies, so a token marked used but never saved is still usable here, as in the database. */
class InMemoryEmailVerificationTokenStore implements EmailVerificationTokenStore {

    private final Map<Long, EmailVerificationToken> rows = new HashMap<>();
    private final AtomicLong ids = new AtomicLong();

    @Override
    public Optional<EmailVerificationToken> findByTokenHash(String tokenHash) {
        return rows.values().stream().filter(token -> tokenHash.equals(token.getTokenHash())).findFirst().map(this::copy);
    }

    @Override
    public Optional<EmailVerificationToken> findLatest(Long userId) {
        return rows.values().stream().filter(token -> userId.equals(token.getUserId()))
                .max(Comparator.comparing(EmailVerificationToken::getCreatedAt)).map(this::copy);
    }

    @Override
    public EmailVerificationToken save(EmailVerificationToken token) {
        EmailVerificationToken row = copy(token);
        if (row.getId() == null) row.setId(ids.incrementAndGet());
        rows.put(row.getId(), row);
        return copy(row);
    }

    long count() {
        return rows.size();
    }

    private EmailVerificationToken copy(EmailVerificationToken token) {
        return new EmailVerificationToken(token.getId(), token.getUserId(), token.getTokenHash(), token.getExpiresAt(),
                token.getUsedAt(), token.getCreatedAt());
    }
}
