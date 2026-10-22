package com.brandonkamga.lescracks.account.infra.persistence;

import com.brandonkamga.lescracks.account.domain.model.Admin;
import com.brandonkamga.lescracks.account.domain.model.AdminStatus;
import com.brandonkamga.lescracks.account.domain.port.AdminStore;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.enumOf;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.name;

@Component
class JdbcAdminStore implements AdminStore {

    private static final String COLUMNS = "id, username, password_hash, status, created_at, updated_at";

    private static final RowMapper<Admin> ROW = (row, number) -> Admin.builder()
            .id(row.getLong("id"))
            .username(row.getString("username"))
            .passwordHash(row.getString("password_hash"))
            .status(enumOf(row, "status", AdminStatus.class))
            .createdAt(instant(row, "created_at"))
            .updatedAt(instant(row, "updated_at"))
            .build();

    private final JdbcClient jdbc;

    JdbcAdminStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Admin> findByUsername(String username) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM admins WHERE lower(username) = lower(:username) ORDER BY id LIMIT 1")
                .param("username", username).query(ROW).optional();
    }

    @Override
    public List<Admin> findAll() {
        return jdbc.sql("SELECT " + COLUMNS + " FROM admins ORDER BY id").query(ROW).list();
    }

    @Override
    public Admin save(Admin admin) {
        if (admin.getId() == null) {
            Long id = jdbc.sql("""
                    INSERT INTO admins (username, password_hash, status, created_at, updated_at)
                    VALUES (:username, :passwordHash, :status, :createdAt, :updatedAt)
                    RETURNING id""")
                    .param("username", admin.getUsername())
                    .param("passwordHash", admin.getPasswordHash())
                    .param("status", name(admin.getStatus()))
                    .param("createdAt", at(admin.getCreatedAt()))
                    .param("updatedAt", at(admin.getUpdatedAt()))
                    .query(Long.class).single();
            return admin.toBuilder().id(id).build();
        }
        jdbc.sql("UPDATE admins SET username = :username, password_hash = :passwordHash, status = :status, updated_at = :updatedAt WHERE id = :id")
                .param("username", admin.getUsername())
                .param("passwordHash", admin.getPasswordHash())
                .param("status", name(admin.getStatus()))
                .param("updatedAt", at(admin.getUpdatedAt()))
                .param("id", admin.getId())
                .update();
        return admin.toBuilder().build();
    }

    @Override
    public void deleteById(Long id) {
        jdbc.sql("DELETE FROM admins WHERE id = :id").param("id", id).update();
    }
}
