package com.brandonkamga.lescracks.event.infra.persistence;

import com.brandonkamga.lescracks.event.application.EventStatistics;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;

@Component
class JdbcEventStatistics implements EventStatistics {

    private static final RowMapper<EventCard> CARD = (row, number) -> new EventCard(row.getLong("id"), row.getString("slug"),
            row.getString("title"), instant(row, "start_date"), row.getString("status"));

    private final JdbcClient jdbc;

    JdbcEventStatistics(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Map<String, Long> eventsByStatus() {
        return grouped("status");
    }

    @Override
    public Map<String, Long> eventsByType() {
        return grouped("type");
    }

    private Map<String, Long> grouped(String column) {
        Map<String, Long> counts = new LinkedHashMap<>();
        jdbc.sql("SELECT " + column + " AS k, count(*) AS n FROM events GROUP BY " + column + " ORDER BY n DESC")
                .query(row -> { counts.put(row.getString("k"), row.getLong("n")); });
        return counts;
    }

    @Override
    public Timing publishedTiming(Instant now, Instant todayStart) {
        return jdbc.sql("""
                        SELECT count(*) FILTER (WHERE start_date > :now) AS upcoming,
                               count(*) FILTER (WHERE start_date <= :now AND coalesce(end_date, start_date) >= :today) AS ongoing,
                               count(*) FILTER (WHERE start_date <= :now AND coalesce(end_date, start_date) < :today) AS past
                        FROM events WHERE status = 'PUBLISHED'""")
                .param("now", at(now)).param("today", at(todayStart))
                .query((row, number) -> new Timing(row.getLong("upcoming"), row.getLong("ongoing"), row.getLong("past")))
                .single();
    }

    @Override
    public List<EventCard> eventsByPathKey(Collection<String> keys) {
        if (keys.isEmpty()) return List.of();
        return jdbc.sql("SELECT id, slug, title, start_date, status FROM events WHERE slug IN (:keys) OR id::text IN (:keys)")
                .param("keys", keys).query(CARD).list();
    }

    @Override
    public List<EventCard> publishedStartingBetween(Instant from, Instant to, int limit) {
        return jdbc.sql("""
                        SELECT id, slug, title, start_date, status FROM events
                        WHERE status = 'PUBLISHED' AND start_date > :from AND start_date < :to
                        ORDER BY start_date LIMIT :limit""")
                .param("from", at(from)).param("to", at(to)).param("limit", limit).query(CARD).list();
    }
}
