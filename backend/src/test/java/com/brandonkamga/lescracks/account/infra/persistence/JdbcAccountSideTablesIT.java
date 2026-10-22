package com.brandonkamga.lescracks.account.infra.persistence;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountToken;
import com.brandonkamga.lescracks.account.domain.model.Admin;
import com.brandonkamga.lescracks.account.domain.model.AuthProvider;
import com.brandonkamga.lescracks.account.domain.model.ExternalIdentity;
import com.brandonkamga.lescracks.account.domain.model.TokenPurpose;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.account.domain.port.AccountTokenStore;
import com.brandonkamga.lescracks.account.domain.port.AdminStore;
import com.brandonkamga.lescracks.account.domain.port.ExternalIdentityStore;
import com.brandonkamga.lescracks.support.PostgresIT;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

/** Tokens, linked providers and admins: every statement of their adapters. */
@Transactional
class JdbcAccountSideTablesIT extends PostgresIT {

    @Autowired private AccountStore accounts;
    @Autowired private AccountTokenStore tokens;
    @Autowired private ExternalIdentityStore identities;
    @Autowired private AdminStore admins;

    private Account account;

    @BeforeEach
    void setUp() {
        account = accounts.save(Account.builder().email("side@example.com").firstName("A").lastName("B").passwordHash("h").build());
    }

    @Test
    @DisplayName("a token is found by purpose and hash, the latest one per purpose, and its use is recorded")
    void tokens() {
        Instant now = Instant.now().truncatedTo(ChronoUnit.MICROS);
        tokens.save(AccountToken.builder().accountId(account.getId()).purpose(TokenPurpose.EMAIL_VERIFICATION)
                .tokenHash("old").expiresAt(now.plusSeconds(60)).createdAt(now.minusSeconds(120)).build());
        AccountToken latest = tokens.save(AccountToken.builder().accountId(account.getId()).purpose(TokenPurpose.EMAIL_VERIFICATION)
                .tokenHash("new").expiresAt(now.plusSeconds(60)).createdAt(now).build());

        assertThat(tokens.findByHash(TokenPurpose.PASSWORD_RESET, "new")).isEmpty();
        assertThat(tokens.findLatest(account.getId(), TokenPurpose.EMAIL_VERIFICATION).orElseThrow().getTokenHash()).isEqualTo("new");

        latest.markUsed();
        tokens.save(latest);
        assertThat(tokens.findByHash(TokenPurpose.EMAIL_VERIFICATION, "new").orElseThrow().isValid()).isFalse();
    }

    @Test
    @DisplayName("a linked provider is found three ways, updated, counted and removed")
    void identities() {
        ExternalIdentity linked = identities.save(ExternalIdentity.builder().accountId(account.getId())
                .provider(AuthProvider.GITHUB).externalId("gh-1").build());

        assertThat(identities.findByProviderAndExternalId(AuthProvider.GITHUB, "gh-1")).isPresent();
        assertThat(identities.findByAccountAndProvider(account.getId(), AuthProvider.GITHUB)).isPresent();
        assertThat(identities.findByAccount(account.getId())).hasSize(1);
        assertThat(identities.countByAccount(account.getId())).isEqualTo(1);

        linked.setExternalId("gh-2");
        identities.save(linked);
        assertThat(identities.findByProviderAndExternalId(AuthProvider.GITHUB, "gh-2")).isPresent();

        identities.delete(linked.getId());
        assertThat(identities.countByAccount(account.getId())).isZero();
    }

    @Test
    @DisplayName("an admin is found by username in any case, updated and deleted")
    void admins() {
        Admin saved = admins.save(Admin.builder().username("it-root").passwordHash("hash").build());

        assertThat(admins.findByUsername("IT-Root")).isPresent();
        saved.setPasswordHash("other");
        admins.save(saved);
        assertThat(admins.findByUsername("it-root").orElseThrow().getPasswordHash()).isEqualTo("other");
        assertThat(admins.findAll()).extracting(Admin::getUsername).contains("it-root");

        admins.deleteById(saved.getId());
        assertThat(admins.findByUsername("it-root")).isEmpty();
    }
}
