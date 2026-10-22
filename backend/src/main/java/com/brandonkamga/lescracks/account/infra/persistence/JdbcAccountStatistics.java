package com.brandonkamga.lescracks.account.infra.persistence;

import com.brandonkamga.lescracks.account.application.AccountStatistics;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;

@Component
class JdbcAccountStatistics implements AccountStatistics {

    private final JdbcClient jdbc;

    JdbcAccountStatistics(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Map<String, Long> membersByStatus() {
        return grouped("status");
    }

    @Override
    public Map<String, Long> membersByProvider() {
        return grouped("provider");
    }

    private Map<String, Long> grouped(String column) {
        Map<String, Long> counts = new LinkedHashMap<>();
        jdbc.sql("SELECT " + column + " AS k, count(*) AS n FROM accounts GROUP BY " + column + " ORDER BY n DESC")
                .query(row -> { counts.put(row.getString("k"), row.getLong("n")); });
        return counts;
    }

    @Override
    public long verifiedMembers() {
        return jdbc.sql("SELECT count(*) FROM accounts WHERE email_verified").query(Long.class).single();
    }

    @Override
    public long membersCreatedSince(Instant since) {
        return jdbc.sql("SELECT count(*) FROM accounts WHERE created_at > :since")
                .param("since", at(since)).query(Long.class).single();
    }

    @Override
    public long seenSince(Instant since) {
        return jdbc.sql("SELECT count(*) FROM accounts WHERE last_seen_at > :since").param("since", at(since)).query(Long.class).single();
    }

    @Override
    public Map<LocalDate, Long> memberGrowth(Instant from, Instant to) {
        Map<LocalDate, Long> days = new LinkedHashMap<>();
        jdbc.sql("SELECT cast(created_at AS date) AS d, count(*) AS n FROM accounts "
                        + "WHERE created_at >= :from AND created_at <= :to GROUP BY d ORDER BY d")
                .param("from", at(from)).param("to", at(to))
                .query(row -> { days.put(row.getObject("d", LocalDate.class), row.getLong("n")); });
        return days;
    }

    @Override
    public SignupCohort signupsSince(Instant since) {
        Set<Long> ids = new HashSet<>();
        long[] verified = {0};
        long[] returned = {0};
        jdbc.sql("SELECT id, email_verified, last_seen_at > created_at + INTERVAL '1 day' AS came_back FROM accounts "
                        + "WHERE created_at > :since")
                .param("since", at(since))
                .query(row -> {
                    ids.add(row.getLong("id"));
                    if (row.getBoolean("email_verified")) verified[0]++;
                    if (row.getBoolean("came_back")) returned[0]++;
                });
        return new SignupCohort(ids, verified[0], returned[0]);
    }
}
