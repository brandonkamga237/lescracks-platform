package com.brandonkamga.lescracks.account.infra.persistence;

import com.brandonkamga.lescracks.account.domain.model.AuthProvider;
import com.brandonkamga.lescracks.account.domain.model.ExternalIdentity;
import com.brandonkamga.lescracks.account.domain.port.ExternalIdentityStore;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.enumOf;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;

@Component
class JdbcExternalIdentityStore implements ExternalIdentityStore {

    private static final String COLUMNS = "id, account_id, provider, external_id, created_at, updated_at";

    private static final RowMapper<ExternalIdentity> ROW = (row, number) -> ExternalIdentity.builder()
            .id(row.getLong("id"))
            .accountId(row.getLong("account_id"))
            .provider(enumOf(row, "provider", AuthProvider.class))
            .externalId(row.getString("external_id"))
            .createdAt(instant(row, "created_at"))
            .updatedAt(instant(row, "updated_at"))
            .build();

    private final JdbcClient jdbc;

    JdbcExternalIdentityStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<ExternalIdentity> findByProviderAndExternalId(AuthProvider provider, String externalId) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM account_identities WHERE provider = :provider AND external_id = :externalId")
                .param("provider", provider.name()).param("externalId", externalId).query(ROW).optional();
    }

    @Override
    public Optional<ExternalIdentity> findByAccountAndProvider(Long accountId, AuthProvider provider) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM account_identities WHERE account_id = :account AND provider = :provider")
                .param("account", accountId).param("provider", provider.name()).query(ROW).optional();
    }

    @Override
    public List<ExternalIdentity> findByAccount(Long accountId) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM account_identities WHERE account_id = :account ORDER BY created_at")
                .param("account", accountId).query(ROW).list();
    }

    @Override
    public int countByAccount(Long accountId) {
        return jdbc.sql("SELECT count(*) FROM account_identities WHERE account_id = :account")
                .param("account", accountId).query(Integer.class).single();
    }

    @Override
    public ExternalIdentity save(ExternalIdentity identity) {
        if (identity.getId() == null) {
            Long id = jdbc.sql("""
                    INSERT INTO account_identities (account_id, provider, external_id, created_at, updated_at)
                    VALUES (:account, :provider, :externalId, :createdAt, :updatedAt)
                    RETURNING id""")
                    .param("account", identity.getAccountId())
                    .param("provider", identity.getProvider().name())
                    .param("externalId", identity.getExternalId())
                    .param("createdAt", at(identity.getCreatedAt()))
                    .param("updatedAt", at(identity.getUpdatedAt()))
                    .query(Long.class).single();
            return identity.toBuilder().id(id).build();
        }
        jdbc.sql("UPDATE account_identities SET external_id = :externalId, updated_at = :updatedAt WHERE id = :id")
                .param("externalId", identity.getExternalId())
                .param("updatedAt", at(identity.getUpdatedAt()))
                .param("id", identity.getId())
                .update();
        return identity.toBuilder().build();
    }

    @Override
    public void delete(Long id) {
        jdbc.sql("DELETE FROM account_identities WHERE id = :id").param("id", id).update();
    }
}
