package com.brandonkamga.lescracks.account.infra.persistence;

import com.brandonkamga.lescracks.account.domain.model.AccountToken;
import com.brandonkamga.lescracks.account.domain.model.TokenPurpose;
import com.brandonkamga.lescracks.account.domain.port.AccountTokenStore;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.Optional;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.enumOf;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;

@Component
class JdbcAccountTokenStore implements AccountTokenStore {

    private static final String COLUMNS = "id, account_id, purpose, token_hash, expires_at, used_at, created_at";

    private static final RowMapper<AccountToken> ROW = (row, number) -> AccountToken.builder()
            .id(row.getLong("id"))
            .accountId(row.getLong("account_id"))
            .purpose(enumOf(row, "purpose", TokenPurpose.class))
            .tokenHash(row.getString("token_hash"))
            .expiresAt(instant(row, "expires_at"))
            .usedAt(instant(row, "used_at"))
            .createdAt(instant(row, "created_at"))
            .build();

    private final JdbcClient jdbc;

    JdbcAccountTokenStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<AccountToken> findByHash(TokenPurpose purpose, String tokenHash) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM account_tokens WHERE token_hash = :hash AND purpose = :purpose")
                .param("hash", tokenHash).param("purpose", purpose.name()).query(ROW).optional();
    }

    @Override
    public Optional<AccountToken> findLatest(Long accountId, TokenPurpose purpose) {
        // Served by account_tokens_latest_idx.
        return jdbc.sql("SELECT " + COLUMNS + " FROM account_tokens WHERE account_id = :account AND purpose = :purpose "
                        + "ORDER BY created_at DESC LIMIT 1")
                .param("account", accountId).param("purpose", purpose.name()).query(ROW).optional();
    }

    @Override
    public AccountToken save(AccountToken token) {
        if (token.getId() == null) {
            Long id = jdbc.sql("""
                    INSERT INTO account_tokens (account_id, purpose, token_hash, expires_at, used_at, created_at)
                    VALUES (:account, :purpose, :hash, :expiresAt, :usedAt, :createdAt)
                    RETURNING id""")
                    .param("account", token.getAccountId())
                    .param("purpose", token.getPurpose().name())
                    .param("hash", token.getTokenHash())
                    .param("expiresAt", at(token.getExpiresAt()))
                    .param("usedAt", at(token.getUsedAt()))
                    .param("createdAt", at(token.getCreatedAt()))
                    .query(Long.class).single();
            return token.toBuilder().id(id).build();
        }
        // Only the use is ever recorded on an existing token.
        jdbc.sql("UPDATE account_tokens SET used_at = :usedAt WHERE id = :id")
                .param("usedAt", at(token.getUsedAt())).param("id", token.getId()).update();
        return token.toBuilder().build();
    }
}
