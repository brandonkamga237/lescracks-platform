package com.brandonkamga.lescracks.event.infra.persistence;

import com.brandonkamga.lescracks.event.domain.model.DueReminder;
import com.brandonkamga.lescracks.event.domain.model.ReminderMoment;
import com.brandonkamga.lescracks.event.domain.port.ReminderStore;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.enumOf;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;

@Component
class JdbcReminderStore implements ReminderStore {

    // Each moment is a window before the start: [start - opens_before, start - closes_before).
    // The start_date bounds come first so the (status, start_date) index narrows the events.
    private static final String DUE = """
            SELECT r.id AS registration_id, r.user_id, w.moment, e.id AS event_id, e.slug, e.title, e.start_date, e.location
            FROM events e
            JOIN event_registrations r ON r.event_id = e.id
            CROSS JOIN LATERAL (VALUES ('HOUR_BEFORE', interval '0 hours', interval '1 hour'),
                                       ('DAY_BEFORE', interval '1 hour', interval '24 hours'))
                AS w(moment, closes_before, opens_before)
            WHERE e.status = 'PUBLISHED'
              AND e.start_date > :now AND e.start_date <= CAST(:now AS timestamptz) + interval '24 hours'
              AND e.type <> 'HACKATHON'
              AND r.status = 'REGISTERED'
              AND e.start_date - w.opens_before <= :now AND :now < e.start_date - w.closes_before
              AND NOT EXISTS (SELECT 1 FROM event_reminders s WHERE s.registration_id = r.id AND s.moment = w.moment)
            ORDER BY e.start_date, r.id
            """;

    private static final RowMapper<DueReminder> ROW = (row, number) -> new DueReminder(
            row.getLong("registration_id"),
            row.getLong("user_id"),
            enumOf(row, "moment", ReminderMoment.class),
            row.getLong("event_id"),
            row.getString("slug"),
            row.getString("title"),
            instant(row, "start_date"),
            row.getString("location"));

    private final JdbcClient jdbc;

    JdbcReminderStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<DueReminder> findDue(Instant now) {
        return jdbc.sql(DUE).param("now", at(now)).query(ROW).list();
    }

    @Override
    public void markSent(Collection<DueReminder> reminders, Instant at) {
        if (reminders.isEmpty()) return;
        Long[] registrations = reminders.stream().map(DueReminder::registrationId).toArray(Long[]::new);
        String[] moments = reminders.stream().map(reminder -> reminder.moment().name()).toArray(String[]::new);
        jdbc.sql("""
                INSERT INTO event_reminders (registration_id, moment, sent_at)
                SELECT unnest(:registrations), unnest(:moments), :at
                ON CONFLICT DO NOTHING
                """)
                .param("registrations", registrations).param("moments", moments).param("at", at(at)).update();
    }
}
