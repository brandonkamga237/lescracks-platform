package com.brandonkamga.lescracks.account.infra.persistence;

import com.brandonkamga.lescracks.account.application.AccountStatistics;
import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AuthProvider;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.support.PostgresIT;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

/** The dashboard's account figures against real PostgreSQL. */
@Transactional
class JdbcAccountStatisticsIT extends PostgresIT {

    @Autowired private AccountStore accounts;
    @Autowired private AccountStatistics statistics;

    private Account save(String email, String passwordHash, AuthProvider provider, boolean verified) {
        return accounts.save(Account.builder().email(email).firstName("A").lastName("B")
                .passwordHash(passwordHash).provider(provider).emailVerified(verified).build());
    }

    @Test
    @DisplayName("newsletter-only contacts are counted apart from members, who can sign in")
    void membersAndContacts() {
        long contacts = statistics.newsletterContacts();
        long verified = statistics.verifiedMembers();
        long github = statistics.membersByProvider().getOrDefault("GITHUB", 0L);

        save("contact@example.com", null, AuthProvider.LOCAL, false);
        save("member@example.com", "hash", AuthProvider.LOCAL, true);
        save("github@example.com", null, AuthProvider.GITHUB, true);

        assertThat(statistics.newsletterContacts()).isEqualTo(contacts + 1);
        assertThat(statistics.verifiedMembers()).isEqualTo(verified + 2);
        assertThat(statistics.membersByProvider().get("GITHUB")).isEqualTo(github + 1);
        assertThat(statistics.membersCreatedSince(Instant.now().minus(1, ChronoUnit.HOURS))).isGreaterThanOrEqualTo(2);
        assertThat(statistics.memberGrowth(Instant.now().minus(1, ChronoUnit.DAYS), Instant.now()).values().stream()
                .mapToLong(Long::longValue).sum()).isGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("the sign-up cohort counts who confirmed and who came back a day later")
    void signupCohort() {
        Instant since = Instant.now().minus(7, ChronoUnit.DAYS);
        AccountStatistics.SignupCohort before = statistics.signupsSince(since);

        accounts.save(Account.builder().email("back@example.com").firstName("A").lastName("B").passwordHash("hash")
                .emailVerified(true).createdAt(Instant.now().minus(3, ChronoUnit.DAYS)).lastSeenAt(Instant.now()).build());
        save("gone@example.com", "hash", AuthProvider.LOCAL, false);
        save("contact2@example.com", null, AuthProvider.LOCAL, false);

        AccountStatistics.SignupCohort after = statistics.signupsSince(since);
        assertThat(after.signedUp()).isEqualTo(before.signedUp() + 2);
        assertThat(after.verified()).isEqualTo(before.verified() + 1);
        assertThat(after.returned()).isEqualTo(before.returned() + 1);
        assertThat(statistics.seenSince(Instant.now().minus(1, ChronoUnit.HOURS))).isGreaterThanOrEqualTo(1);
    }
}
