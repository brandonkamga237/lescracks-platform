package com.brandonkamga.lescracks.newsletter.infra.persistence;

import com.brandonkamga.lescracks.newsletter.application.NewsletterStatistics;
import com.brandonkamga.lescracks.newsletter.domain.model.SubscriptionStatus;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;

@Component
class JdbcNewsletterStatistics implements NewsletterStatistics {

    private final JdbcClient jdbc;

    JdbcNewsletterStatistics(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public long countByStatus(SubscriptionStatus status) {
        return jdbc.sql("SELECT count(*) FROM newsletter_subscribers WHERE status = :status")
                .param("status", status.name()).query(Long.class).single();
    }

    @Override
    public long subscribedSince(Instant since) {
        return jdbc.sql("SELECT count(*) FROM newsletter_subscribers WHERE status = 'SUBSCRIBED' AND subscribed_at > :since")
                .param("since", at(since)).query(Long.class).single();
    }

    @Override
    public long unsubscribedSince(Instant since) {
        return jdbc.sql("SELECT count(*) FROM newsletter_subscribers WHERE status = 'UNSUBSCRIBED' AND unsubscribed_at > :since")
                .param("since", at(since)).query(Long.class).single();
    }

    @Override
    public long countWithoutAccount() {
        return jdbc.sql("SELECT count(*) FROM newsletter_subscribers WHERE account_id IS NULL").query(Long.class).single();
    }

    @Override
    public Map<LocalDate, Long> growth(Instant from, Instant to) {
        Map<LocalDate, Long> days = new LinkedHashMap<>();
        jdbc.sql("SELECT cast(subscribed_at AS date) AS d, count(*) AS n FROM newsletter_subscribers "
                        + "WHERE status = 'SUBSCRIBED' AND subscribed_at >= :from AND subscribed_at <= :to GROUP BY d ORDER BY d")
                .param("from", at(from)).param("to", at(to))
                .query(row -> { days.put(row.getObject("d", LocalDate.class), row.getLong("n")); });
        return days;
    }
}
