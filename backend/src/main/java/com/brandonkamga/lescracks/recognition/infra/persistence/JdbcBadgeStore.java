package com.brandonkamga.lescracks.recognition.infra.persistence;

import com.brandonkamga.lescracks.recognition.domain.model.Badge;
import com.brandonkamga.lescracks.recognition.domain.port.BadgeStore;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;

@Component
class JdbcBadgeStore implements BadgeStore {

    static final String COLUMNS = "b.id, b.code, b.name, b.description, b.icon, b.system, b.created_at";

    static final RowMapper<Badge> ROW = (row, number) -> Badge.builder()
            .id(row.getLong("id"))
            .code(row.getString("code"))
            .name(row.getString("name"))
            .description(row.getString("description"))
            .icon(row.getString("icon"))
            .system(row.getBoolean("system"))
            .createdAt(instant(row, "created_at"))
            .build();

    private final JdbcClient jdbc;

    JdbcBadgeStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Badge> findAll() {
        return jdbc.sql("SELECT " + COLUMNS + " FROM badges b ORDER BY b.system DESC, b.name").query(ROW).list();
    }

    @Override
    public Optional<Badge> findById(Long id) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM badges b WHERE b.id = :id").param("id", id).query(ROW).optional();
    }

    @Override
    public Optional<Badge> findByCode(String code) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM badges b WHERE b.code = :code").param("code", code).query(ROW).optional();
    }

    @Override
    public boolean codeTaken(String code) {
        return jdbc.sql("SELECT EXISTS (SELECT 1 FROM badges WHERE code = :code)").param("code", code).query(Boolean.class).single();
    }

    @Override
    public Badge save(Badge badge) {
        if (badge.getId() == null) {
            Long id = jdbc.sql("""
                    INSERT INTO badges (code, name, description, icon, system, created_at)
                    VALUES (:code, :name, :description, :icon, :system, :createdAt)
                    RETURNING id""")
                    .param("code", badge.getCode()).param("name", badge.getName()).param("description", badge.getDescription())
                    .param("icon", badge.getIcon()).param("system", badge.isSystem()).param("createdAt", at(badge.getCreatedAt()))
                    .query(Long.class).single();
            return badge.toBuilder().id(id).build();
        }
        jdbc.sql("UPDATE badges SET name = :name, description = :description, icon = :icon WHERE id = :id")
                .param("name", badge.getName()).param("description", badge.getDescription()).param("icon", badge.getIcon())
                .param("id", badge.getId()).update();
        return badge.toBuilder().build();
    }

    @Override
    public void delete(Long id) {
        jdbc.sql("DELETE FROM badges WHERE id = :id").param("id", id).update();
    }

    @Override
    public Map<Long, Long> countHolders() {
        Map<Long, Long> counts = new HashMap<>();
        jdbc.sql("SELECT badge_id, count(*) AS n FROM member_badges GROUP BY badge_id")
                .query(row -> { counts.put(row.getLong("badge_id"), row.getLong("n")); });
        return counts;
    }
}
