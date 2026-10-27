package com.brandonkamga.lescracks.event.infra.persistence;

import com.brandonkamga.lescracks.event.domain.model.Registration;
import com.brandonkamga.lescracks.event.domain.model.RegistrationStatus;
import com.brandonkamga.lescracks.event.domain.port.RegistrationStore;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.enumOf;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;

@Component
class JdbcRegistrationStore implements RegistrationStore {

    private static final String COLUMNS = "r.id, r.event_id, r.user_id, r.status, r.created_at, r.updated_at";

    private static final RowMapper<Registration> ROW = (row, number) -> Registration.builder()
            .id(row.getLong("id"))
            .eventId(row.getLong("event_id"))
            .userId(row.getLong("user_id"))
            .status(enumOf(row, "status", RegistrationStatus.class))
            .createdAt(instant(row, "created_at"))
            .updatedAt(instant(row, "updated_at"))
            .build();

    private final JdbcClient jdbc;

    JdbcRegistrationStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Registration> findById(Long id) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM event_registrations r WHERE r.id = :id").param("id", id).query(ROW).optional();
    }

    @Override
    public Optional<Registration> find(Long eventId, Long userId) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM event_registrations r WHERE r.event_id = :event AND r.user_id = :user")
                .param("event", eventId).param("user", userId).query(ROW).optional();
    }

    @Override
    public List<Registration> findByEvent(Long eventId) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM event_registrations r WHERE r.event_id = :event ORDER BY r.created_at, r.id")
                .param("event", eventId).query(ROW).list();
    }

    @Override
    public List<Registration> findActiveByMember(Long userId) {
        return jdbc.sql("SELECT " + COLUMNS + """
                         FROM event_registrations r JOIN events e ON e.id = r.event_id
                        WHERE r.user_id = :user AND r.status <> 'CANCELLED'
                        ORDER BY e.start_date DESC""")
                .param("user", userId).query(ROW).list();
    }

    @Override
    public Registration save(Registration registration) {
        if (registration.getId() == null) {
            Long id = jdbc.sql("""
                    INSERT INTO event_registrations (event_id, user_id, status, created_at, updated_at)
                    VALUES (:event, :user, :status, :createdAt, :updatedAt)
                    RETURNING id""")
                    .param("event", registration.getEventId()).param("user", registration.getUserId())
                    .param("status", registration.getStatus().name())
                    .param("createdAt", at(registration.getCreatedAt())).param("updatedAt", at(registration.getUpdatedAt()))
                    .query(Long.class).single();
            return registration.toBuilder().id(id).build();
        }
        jdbc.sql("UPDATE event_registrations SET status = :status, updated_at = :updatedAt WHERE id = :id")
                .param("status", registration.getStatus().name()).param("updatedAt", at(registration.getUpdatedAt()))
                .param("id", registration.getId()).update();
        return registration.toBuilder().build();
    }

    @Override
    public void shiftCount(Long eventId, int delta) {
        jdbc.sql("UPDATE events SET registration_count = greatest(registration_count + :delta, 0) WHERE id = :event")
                .param("delta", delta).param("event", eventId).update();
    }

    @Override
    public void releaseCountsOf(Long userId) {
        jdbc.sql("""
                        UPDATE events e SET registration_count = greatest(e.registration_count - 1, 0)
                        FROM event_registrations r
                        WHERE r.event_id = e.id AND r.user_id = :user AND r.status <> 'CANCELLED'""")
                .param("user", userId).update();
    }
}
