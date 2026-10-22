package com.brandonkamga.lescracks.taxonomy.infra.persistence;

import com.brandonkamga.lescracks.taxonomy.domain.model.Tag;
import com.brandonkamga.lescracks.taxonomy.domain.port.TagStore;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Component
class JdbcTagStore implements TagStore {

    private static final RowMapper<Tag> ROW = (row, number) -> new Tag(row.getLong("id"), row.getString("name"));

    private final JdbcClient jdbc;

    JdbcTagStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Tag> findAll() {
        return jdbc.sql("SELECT id, name FROM tags ORDER BY name").query(ROW).list();
    }

    @Override
    public List<Tag> findAllById(Collection<Long> ids) {
        if (ids.isEmpty()) return List.of();
        return jdbc.sql("SELECT id, name FROM tags WHERE id IN (:ids)").param("ids", ids).query(ROW).list();
    }

    @Override
    public Optional<Tag> findById(Long id) {
        return jdbc.sql("SELECT id, name FROM tags WHERE id = :id").param("id", id).query(ROW).optional();
    }

    @Override
    public Optional<Tag> findByName(String name) {
        return jdbc.sql("SELECT id, name FROM tags WHERE lower(name) = lower(:name)").param("name", name).query(ROW).optional();
    }

    @Override
    public Tag save(Tag tag) {
        if (tag.getId() == null) {
            Long id = jdbc.sql("INSERT INTO tags (name) VALUES (:name) RETURNING id").param("name", tag.getName()).query(Long.class).single();
            return new Tag(id, tag.getName());
        }
        jdbc.sql("UPDATE tags SET name = :name WHERE id = :id").param("name", tag.getName()).param("id", tag.getId()).update();
        return tag.toBuilder().build();
    }

    @Override
    public void delete(Long id) {
        jdbc.sql("DELETE FROM tags WHERE id = :id").param("id", id).update();
    }
}
