package com.brandonkamga.lescracks.account.infra.persistence;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;

/** Stamps accounts.last_seen_at: one conditional statement, at most one row write per member per hour. */
@Component
public class JdbcLastSeen {

    private static final Duration STALE_AFTER = Duration.ofHours(1);

    private final JdbcClient jdbc;

    JdbcLastSeen(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void touch(String email) {
        Instant now = Instant.now();
        jdbc.sql("UPDATE accounts SET last_seen_at = :now WHERE lower(email) = lower(:email) "
                        + "AND (last_seen_at IS NULL OR last_seen_at < :staleBefore)")
                .param("now", at(now)).param("email", email).param("staleBefore", at(now.minus(STALE_AFTER)))
                .update();
    }
}
