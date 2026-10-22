package com.brandonkamga.lescracks.account.infra.persistence;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountSearch;
import com.brandonkamga.lescracks.account.domain.model.AccountStatus;
import com.brandonkamga.lescracks.account.domain.model.AuthProvider;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;
import com.brandonkamga.lescracks.support.PostgresIT;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Every statement of JdbcAccountStore against PostgreSQL, with the schema Flyway builds. */
@Transactional
class JdbcAccountStoreIT extends PostgresIT {

    @Autowired private AccountStore accounts;
    @Autowired private JdbcLastSeen lastSeen;

    private Account save(String email, String passwordHash, AuthProvider provider, boolean verified) {
        return accounts.save(Account.builder().email(email).firstName("A").lastName("B")
                .passwordHash(passwordHash).provider(provider).emailVerified(verified).build());
    }

    @Test
    @DisplayName("an account goes in and comes back whole, found by id or by email in any case")
    void roundTrip() {
        Account saved = accounts.save(Account.builder().email("round@example.com").passwordHash("hash")
                .firstName("Awa").lastName("Diallo").provider(AuthProvider.GITHUB).emailVerified(true)
                .createdAt(Instant.now().minus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.MICROS))
                .signupPath("/blog").signupLanguage("fr").signupTimezone("Africa/Douala").build());

        Account found = accounts.findByEmail("ROUND@Example.com").orElseThrow();
        assertThat(found.getId()).isEqualTo(saved.getId());
        assertThat(found).usingRecursiveComparison().ignoringFields("updatedAt").isEqualTo(saved);
        assertThat(accounts.findById(saved.getId())).isPresent();
    }

    @Test
    @DisplayName("an update changes the row but never rolls back the last visit written meanwhile")
    void updateKeepsLastSeen() {
        Account saved = save("update@example.com", "hash", AuthProvider.LOCAL, false);
        lastSeen.touch("update@example.com");

        saved.setStatus(AccountStatus.BANNED);
        saved.setEmailVerified(true);
        accounts.save(saved);

        Account stored = accounts.findById(saved.getId()).orElseThrow();
        assertThat(stored.getStatus()).isEqualTo(AccountStatus.BANNED);
        assertThat(stored.isEmailVerified()).isTrue();
        assertThat(stored.getLastSeenAt()).isNotNull();
    }

    @Test
    @DisplayName("a batch lookup is one query and skips unknown ids")
    void batch() {
        Account a = save("batch-a@example.com", "hash", AuthProvider.LOCAL, false);
        Account b = save("batch-b@example.com", null, AuthProvider.GOOGLE, false);

        assertThat(accounts.findAllById(List.of(a.getId(), b.getId(), -1L))).extracting(Account::getEmail)
                .containsExactlyInAnyOrder("batch-a@example.com", "batch-b@example.com");
        assertThat(accounts.findAllById(List.of())).isEmpty();
        assertThat(accounts.findAllByEmail(List.of(" BATCH-A@example.com", "batch-b@example.com", "nobody@example.com")))
                .extracting(Account::getEmail).containsExactlyInAnyOrder("batch-a@example.com", "batch-b@example.com");
        assertThat(accounts.findAllByEmail(List.of())).isEmpty();
    }

    @Test
    @DisplayName("the back-office filters combine: text in any case, verified or not")
    void filters() {
        save("filter-member@example.com", "hash", AuthProvider.LOCAL, false);
        save("filter-verified@example.com", null, AuthProvider.GITHUB, true);

        assertThat(emails(new AccountSearch("FILTER-", false))).containsExactly("filter-member@example.com");
        assertThat(emails(new AccountSearch("filter-", true))).containsExactly("filter-verified@example.com");
        assertThat(emails(new AccountSearch("filter-", null))).hasSize(2);
    }

    @Test
    @DisplayName("a page carries its total, newest first, even when asked past the end")
    void paging() {
        for (int i = 0; i < 3; i++) save("page-" + i + "@example.com", "hash", AuthProvider.LOCAL, false);
        AccountSearch search = new AccountSearch("page-", null);

        Paged<Account> first = accounts.search(search, new PageQuery(0, 2));
        Paged<Account> beyond = accounts.search(search, new PageQuery(5, 2));

        assertThat(first.items()).hasSize(2);
        assertThat(first.total()).isEqualTo(3);
        assertThat(first.items().get(0).getEmail()).isEqualTo("page-2@example.com");
        assertThat(beyond.items()).isEmpty();
        assertThat(beyond.total()).isEqualTo(3);
    }

    @Test
    @DisplayName("deleting an account removes it")
    void deletes() {
        Account saved = save("gone@example.com", "hash", AuthProvider.LOCAL, false);

        accounts.delete(saved.getId());

        assertThat(accounts.findById(saved.getId())).isEmpty();
    }

    private List<String> emails(AccountSearch search) {
        return accounts.searchAll(search).stream().map(Account::getEmail).toList();
    }
}
