package com.brandonkamga.lescracks.account.infra.persistence;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountSearch;
import com.brandonkamga.lescracks.account.domain.model.AccountStatus;
import com.brandonkamga.lescracks.account.domain.model.AuthProvider;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.enumOf;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.name;

@Component
class JdbcAccountStore implements AccountStore {

    private static final String COLUMNS = """
            id, email, password_hash, first_name, last_name, status, email_verified, provider,
            created_at, updated_at, last_seen_at, signup_path, signup_language, signup_timezone""";

    /** Same rule as {@link Account#hasLoginMethod()}. */
    static final String CAN_SIGN_IN = "(password_hash IS NOT NULL OR provider <> 'LOCAL')";

    private static final RowMapper<Account> ROW = (row, number) -> Account.builder()
            .id(row.getLong("id"))
            .email(row.getString("email"))
            .passwordHash(row.getString("password_hash"))
            .firstName(row.getString("first_name"))
            .lastName(row.getString("last_name"))
            .status(enumOf(row, "status", AccountStatus.class))
            .emailVerified(row.getBoolean("email_verified"))
            .provider(enumOf(row, "provider", AuthProvider.class))
            .createdAt(instant(row, "created_at"))
            .updatedAt(instant(row, "updated_at"))
            .lastSeenAt(instant(row, "last_seen_at"))
            .signupPath(row.getString("signup_path"))
            .signupLanguage(row.getString("signup_language"))
            .signupTimezone(row.getString("signup_timezone"))
            .build();

    private final JdbcClient jdbc;

    JdbcAccountStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Account> findById(Long id) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM accounts WHERE id = :id").param("id", id).query(ROW).optional();
    }

    @Override
    public Optional<Account> findByEmail(String email) {
        // Served by accounts_email_lower_idx.
        return jdbc.sql("SELECT " + COLUMNS + " FROM accounts WHERE lower(email) = lower(:email) ORDER BY id LIMIT 1")
                .param("email", email).query(ROW).optional();
    }

    @Override
    public List<Account> findAllById(Collection<Long> ids) {
        if (ids.isEmpty()) return List.of();
        return jdbc.sql("SELECT " + COLUMNS + " FROM accounts WHERE id IN (:ids)").param("ids", ids).query(ROW).list();
    }

    @Override
    public Paged<Account> search(AccountSearch search, PageQuery page) {
        Filter filter = Filter.of(search);
        Map<String, Object> params = new HashMap<>(filter.params());
        params.put("limit", page.size());
        params.put("offset", (long) page.page() * page.size());
        List<Long> totals = new ArrayList<>();
        List<Account> accounts = jdbc.sql("SELECT " + COLUMNS + ", count(*) OVER () AS total FROM accounts" + filter.where()
                        + " ORDER BY created_at DESC, id DESC LIMIT :limit OFFSET :offset")
                .params(params)
                .query((row, number) -> {
                    if (number == 0) totals.add(row.getLong("total"));
                    return ROW.mapRow(row, number);
                })
                .list();
        long total = !totals.isEmpty() ? totals.get(0) : page.page() == 0 ? 0 : count(filter);
        return new Paged<>(accounts, page.page(), page.size(), total);
    }

    @Override
    public List<Account> searchAll(AccountSearch search) {
        Filter filter = Filter.of(search);
        return jdbc.sql("SELECT " + COLUMNS + " FROM accounts" + filter.where() + " ORDER BY created_at DESC, id DESC")
                .params(filter.params()).query(ROW).list();
    }

    private long count(Filter filter) {
        return jdbc.sql("SELECT count(*) FROM accounts" + filter.where()).params(filter.params()).query(Long.class).single();
    }

    @Override
    public Account save(Account account) {
        Map<String, Object> params = new HashMap<>();
        params.put("email", account.getEmail());
        params.put("passwordHash", account.getPasswordHash());
        params.put("firstName", account.getFirstName());
        params.put("lastName", account.getLastName());
        params.put("status", name(account.getStatus()));
        params.put("emailVerified", account.isEmailVerified());
        params.put("provider", name(account.getProvider()));
        params.put("updatedAt", at(account.getUpdatedAt()));
        params.put("signupPath", account.getSignupPath());
        params.put("signupLanguage", account.getSignupLanguage());
        params.put("signupTimezone", account.getSignupTimezone());
        if (account.getId() == null) {
            params.put("createdAt", at(account.getCreatedAt()));
            params.put("lastSeenAt", at(account.getLastSeenAt()));
            Long id = jdbc.sql("""
                    INSERT INTO accounts (email, password_hash, first_name, last_name, status, email_verified, provider,
                                          created_at, updated_at, last_seen_at, signup_path, signup_language, signup_timezone)
                    VALUES (:email, :passwordHash, :firstName, :lastName, :status, :emailVerified, :provider,
                            :createdAt, :updatedAt, :lastSeenAt, :signupPath, :signupLanguage, :signupTimezone)
                    RETURNING id""").params(params).query(Long.class).single();
            return account.toBuilder().id(id).build();
        }
        params.put("id", account.getId());
        // last_seen_at is LastSeenFilter's: a save holding an older copy must not roll it back.
        int updated = jdbc.sql("""
                UPDATE accounts SET email = :email, password_hash = :passwordHash, first_name = :firstName,
                       last_name = :lastName, status = :status, email_verified = :emailVerified, provider = :provider,
                       updated_at = :updatedAt, signup_path = :signupPath, signup_language = :signupLanguage,
                       signup_timezone = :signupTimezone
                WHERE id = :id""").params(params).update();
        if (updated == 0) throw new IllegalStateException("No account " + account.getId() + " to update");
        return account.toBuilder().build();
    }

    @Override
    public void delete(Long id) {
        jdbc.sql("DELETE FROM accounts WHERE id = :id").param("id", id).update();
    }

    /** The back-office filters as a WHERE clause; values are always bound, never concatenated. */
    private record Filter(String where, Map<String, Object> params) {

        static Filter of(AccountSearch search) {
            List<String> clauses = new ArrayList<>();
            Map<String, Object> params = new HashMap<>();
            if (search.text() != null && !search.text().isBlank()) {
                clauses.add("(lower(email) LIKE :like OR lower(first_name) LIKE :like OR lower(last_name) LIKE :like)");
                params.put("like", "%" + search.text().trim().toLowerCase() + "%");
            }
            if (search.kind() == AccountSearch.Kind.MEMBER) clauses.add(CAN_SIGN_IN);
            if (search.kind() == AccountSearch.Kind.CONTACT) clauses.add("NOT " + CAN_SIGN_IN);
            if (search.verified() != null) {
                clauses.add("email_verified = :verified");
                params.put("verified", search.verified());
            }
            return new Filter(clauses.isEmpty() ? "" : " WHERE " + String.join(" AND ", clauses), params);
        }
    }
}
