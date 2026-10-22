package com.brandonkamga.lescracks.newsletter.infra.persistence;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.newsletter.application.NewsletterStatistics;
import com.brandonkamga.lescracks.newsletter.domain.model.Campaign;
import com.brandonkamga.lescracks.newsletter.domain.model.Subscriber;
import com.brandonkamga.lescracks.newsletter.domain.model.SubscriptionStatus;
import com.brandonkamga.lescracks.newsletter.domain.port.CampaignStore;
import com.brandonkamga.lescracks.newsletter.domain.port.SubscriberStore;
import com.brandonkamga.lescracks.support.PostgresIT;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Every statement of the newsletter adapters against PostgreSQL. */
@Transactional
class JdbcSubscriberStoreIT extends PostgresIT {

    @Autowired private SubscriberStore subscribers;
    @Autowired private CampaignStore campaigns;
    @Autowired private NewsletterStatistics statistics;
    @Autowired private AccountStore accounts;

    @Test
    @DisplayName("a subscriber goes in and comes back by id, address in any case, or token")
    void roundTrip() {
        Subscriber saved = subscribers.save(Subscriber.of("round@example.com", "Awa", "D").toBuilder()
                .subscribedAt(Instant.now().truncatedTo(ChronoUnit.MICROS)).build());

        assertThat(subscribers.findByEmail("ROUND@example.com").orElseThrow()).usingRecursiveComparison().isEqualTo(saved);
        assertThat(subscribers.findByToken(saved.getToken())).isPresent();
        assertThat(subscribers.findById(saved.getId())).isPresent();
    }

    @Test
    @DisplayName("an update changes the status and the account link; one address appears once whatever its case")
    void updateAndUniqueness() {
        Long account = accounts.save(Account.builder().email("link@example.com").firstName("A").lastName("B").passwordHash("h").build()).getId();
        Subscriber saved = subscribers.save(Subscriber.of("link@example.com", "A", "B"));

        saved.setAccountId(account);
        saved.subscribe();
        subscribers.save(saved);

        Subscriber stored = subscribers.findById(saved.getId()).orElseThrow();
        assertThat(stored.getAccountId()).isEqualTo(account);
        assertThat(stored.isSubscribed()).isTrue();
        assertThat(subscribers.findAll(SubscriptionStatus.SUBSCRIBED)).extracting(Subscriber::getEmail).contains("link@example.com");
        assertThatThrownBy(() -> subscribers.save(Subscriber.of("LINK@example.com", null, null)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("the figures count statuses, recent moves, addresses without an account and daily growth")
    void statistics() {
        long subscribed = statistics.countByStatus(SubscriptionStatus.SUBSCRIBED);
        long withoutAccount = statistics.countWithoutAccount();
        Subscriber visitor = Subscriber.of("stats@example.com", null, null);
        visitor.subscribe();
        subscribers.save(visitor);

        assertThat(statistics.countByStatus(SubscriptionStatus.SUBSCRIBED)).isEqualTo(subscribed + 1);
        assertThat(statistics.countWithoutAccount()).isEqualTo(withoutAccount + 1);
        assertThat(statistics.subscribedSince(Instant.now().minus(1, ChronoUnit.HOURS))).isGreaterThanOrEqualTo(1);
        assertThat(statistics.growth(Instant.now().minus(1, ChronoUnit.DAYS), Instant.now()).values().stream()
                .mapToLong(Long::longValue).sum()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("campaigns are recorded and listed newest first")
    void campaigns() {
        campaigns.save(Campaign.builder().subject("Avant").message("{}").recipientCount(3).sentAt(Instant.now().minus(1, ChronoUnit.DAYS)).build());
        campaigns.save(Campaign.builder().subject("Après").message("{}").recipientCount(4).build());

        assertThat(campaigns.findAllNewestFirst()).extracting(Campaign::getSubject).startsWith("Après", "Avant");
    }
}
