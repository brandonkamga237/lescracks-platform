package com.brandonkamga.lescracks.identity.infra;

import com.brandonkamga.lescracks.identity.domain.AuthProvider;
import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.domain.UserSearch;
import com.brandonkamga.lescracks.support.PostgresIT;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** The member and funnel counts of the dashboard, against real PostgreSQL (native SQL and enum literals). */
@Transactional
class UserRepositoryIT extends PostgresIT {

    @Autowired
    private UserRepository users;

    private User save(String email, String passwordHash, AuthProvider provider, boolean verified) {
        return users.saveAndFlush(User.builder().email(email).firstName("A").lastName("B")
                .passwordHash(passwordHash).provider(provider).emailVerified(verified).build());
    }

    @Test
    @DisplayName("newsletter-only contacts are counted apart from members, who can sign in")
    void membersAndContacts() {
        long contacts = users.countNewsletterContacts();
        long verified = users.countVerifiedMembers();

        save("contact@example.com", null, AuthProvider.LOCAL, false);
        save("local@example.com", "hash", AuthProvider.LOCAL, true);
        save("google@example.com", null, AuthProvider.GOOGLE, true);

        assertThat(users.countNewsletterContacts()).isEqualTo(contacts + 1);
        assertThat(users.countVerifiedMembers()).isEqualTo(verified + 2);
        assertThat(users.countMembersCreatedAfter(Instant.now().minus(1, ChronoUnit.HOURS))).isGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("the funnel follows recent members through confirmation, welcome and return")
    void signupFunnel() {
        Instant since = Instant.now().minus(30, ChronoUnit.DAYS);
        Object[] before = users.signupFunnel(since).get(0);

        // created_at is not updatable: the past sign-up date goes in with the insert.
        users.saveAndFlush(User.builder().email("back@example.com").firstName("A").lastName("B").passwordHash("hash")
                .emailVerified(true).createdAt(Instant.now().minus(3, ChronoUnit.DAYS))
                .onboardedAt(Instant.now().minus(3, ChronoUnit.DAYS)).lastSeenAt(Instant.now()).build());
        save("gone@example.com", "hash", AuthProvider.LOCAL, false);
        save("contact2@example.com", null, AuthProvider.LOCAL, false);

        Object[] after = users.signupFunnel(since).get(0);
        assertThat(((Number) after[0]).longValue() - ((Number) before[0]).longValue()).isEqualTo(2);
        assertThat(((Number) after[1]).longValue() - ((Number) before[1]).longValue()).isEqualTo(1);
        assertThat(((Number) after[2]).longValue() - ((Number) before[2]).longValue()).isEqualTo(1);
        assertThat(((Number) after[3]).longValue() - ((Number) before[3]).longValue()).isEqualTo(1);
    }

    @Test
    @DisplayName("the back-office filters combine: text, members or contacts, verified or not")
    void backOfficeFilters() {
        save("filter-contact@example.com", null, AuthProvider.LOCAL, false);
        save("filter-member@example.com", "hash", AuthProvider.LOCAL, false);
        save("filter-verified@example.com", null, AuthProvider.GITHUB, true);

        assertThat(emails(new UserSearch("filter-", UserSearch.Kind.CONTACT, null))).containsExactly("filter-contact@example.com");
        assertThat(emails(new UserSearch("FILTER-", UserSearch.Kind.MEMBER, false))).containsExactly("filter-member@example.com");
        assertThat(emails(new UserSearch("filter-", null, true))).containsExactly("filter-verified@example.com");
        assertThat(emails(new UserSearch("filter-", null, null))).hasSize(3);
    }

    private List<String> emails(UserSearch search) {
        return users.findAll(UserSpecifications.matching(search)).stream().map(User::getEmail).toList();
    }
}
