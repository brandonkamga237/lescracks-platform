package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.AccountToken;
import com.brandonkamga.lescracks.account.domain.model.TokenPurpose;
import com.brandonkamga.lescracks.account.domain.port.AccountTokenStore;

import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

/** Keeps copies, so a token marked used but never saved is still usable here, as in the database. */
class InMemoryAccountTokenStore implements AccountTokenStore {

    private final Map<Long, AccountToken> rows = new HashMap<>();
    private final AtomicLong ids = new AtomicLong();

    @Override
    public Optional<AccountToken> findByHash(TokenPurpose purpose, String tokenHash) {
        return rows.values().stream().filter(token -> token.getPurpose() == purpose && tokenHash.equals(token.getTokenHash()))
                .findFirst().map(token -> token.toBuilder().build());
    }

    @Override
    public Optional<AccountToken> findLatest(Long accountId, TokenPurpose purpose) {
        return rows.values().stream().filter(token -> accountId.equals(token.getAccountId()) && token.getPurpose() == purpose)
                .max(Comparator.comparing(AccountToken::getCreatedAt)).map(token -> token.toBuilder().build());
    }

    @Override
    public AccountToken save(AccountToken token) {
        AccountToken row = token.toBuilder().build();
        if (row.getId() == null) row.setId(ids.incrementAndGet());
        rows.put(row.getId(), row);
        return row.toBuilder().build();
    }

    long count() {
        return rows.size();
    }
}
