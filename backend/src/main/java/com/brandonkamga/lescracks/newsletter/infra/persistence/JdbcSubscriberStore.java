package com.brandonkamga.lescracks.newsletter.infra.persistence;

import com.brandonkamga.lescracks.newsletter.domain.model.Subscriber;
import com.brandonkamga.lescracks.newsletter.domain.model.SubscriptionStatus;
import com.brandonkamga.lescracks.newsletter.domain.port.SubscriberStore;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.enumOf;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.longOrNull;

@Component
class JdbcSubscriberStore implements SubscriberStore {

    private static final String COLUMNS = "id, account_id, email, first_name, last_name, status, subscribed_at, unsubscribed_at, token";

    private static final RowMapper<Subscriber> ROW = (row, number) -> Subscriber.builder()
            .id(row.getLong("id"))
            .accountId(longOrNull(row, "account_id"))
            .email(row.getString("email"))
            .firstName(row.getString("first_name"))
            .lastName(row.getString("last_name"))
            .status(enumOf(row, "status", SubscriptionStatus.class))
            .subscribedAt(instant(row, "subscribed_at"))
            .unsubscribedAt(instant(row, "unsubscribed_at"))
            .token(row.getString("token"))
            .build();

    private final JdbcClient jdbc;

    JdbcSubscriberStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Subscriber> findById(Long id) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM newsletter_subscribers WHERE id = :id").param("id", id).query(ROW).optional();
    }

    @Override
    public Optional<Subscriber> findByEmail(String email) {
        // Served by newsletter_subscribers_email_key.
        return jdbc.sql("SELECT " + COLUMNS + " FROM newsletter_subscribers WHERE lower(email) = lower(:email)")
                .param("email", email.trim()).query(ROW).optional();
    }

    @Override
    public Optional<Subscriber> findByToken(String token) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM newsletter_subscribers WHERE token = :token").param("token", token).query(ROW).optional();
    }

    @Override
    public List<Subscriber> findAll(SubscriptionStatus status) {
        if (status == null) {
            return jdbc.sql("SELECT " + COLUMNS + " FROM newsletter_subscribers ORDER BY subscribed_at DESC, id DESC").query(ROW).list();
        }
        return jdbc.sql("SELECT " + COLUMNS + " FROM newsletter_subscribers WHERE status = :status ORDER BY subscribed_at DESC, id DESC")
                .param("status", status.name()).query(ROW).list();
    }

    @Override
    public Subscriber save(Subscriber subscriber) {
        if (subscriber.getId() == null) {
            Long id = jdbc.sql("""
                    INSERT INTO newsletter_subscribers (account_id, email, first_name, last_name, status, subscribed_at, unsubscribed_at, token)
                    VALUES (:account, :email, :firstName, :lastName, :status, :subscribedAt, :unsubscribedAt, :token)
                    RETURNING id""")
                    .param("account", subscriber.getAccountId())
                    .param("email", subscriber.getEmail())
                    .param("firstName", subscriber.getFirstName())
                    .param("lastName", subscriber.getLastName())
                    .param("status", subscriber.getStatus().name())
                    .param("subscribedAt", at(subscriber.getSubscribedAt()))
                    .param("unsubscribedAt", at(subscriber.getUnsubscribedAt()))
                    .param("token", subscriber.getToken())
                    .query(Long.class).single();
            return subscriber.toBuilder().id(id).build();
        }
        jdbc.sql("""
                UPDATE newsletter_subscribers SET account_id = :account, first_name = :firstName, last_name = :lastName,
                       status = :status, subscribed_at = :subscribedAt, unsubscribed_at = :unsubscribedAt
                WHERE id = :id""")
                .param("account", subscriber.getAccountId())
                .param("firstName", subscriber.getFirstName())
                .param("lastName", subscriber.getLastName())
                .param("status", subscriber.getStatus().name())
                .param("subscribedAt", at(subscriber.getSubscribedAt()))
                .param("unsubscribedAt", at(subscriber.getUnsubscribedAt()))
                .param("id", subscriber.getId())
                .update();
        return subscriber.toBuilder().build();
    }
}
