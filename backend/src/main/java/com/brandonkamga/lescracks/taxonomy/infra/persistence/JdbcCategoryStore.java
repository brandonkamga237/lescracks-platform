package com.brandonkamga.lescracks.taxonomy.infra.persistence;

import com.brandonkamga.lescracks.taxonomy.domain.model.Category;
import com.brandonkamga.lescracks.taxonomy.domain.port.CategoryStore;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Component
class JdbcCategoryStore implements CategoryStore {

    private static final String COLUMNS = "id, name, slug, description";

    private static final RowMapper<Category> ROW = (row, number) -> Category.builder()
            .id(row.getLong("id"))
            .name(row.getString("name"))
            .slug(row.getString("slug"))
            .description(row.getString("description"))
            .build();

    private final JdbcClient jdbc;

    JdbcCategoryStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Category> findAll() {
        return jdbc.sql("SELECT " + COLUMNS + " FROM categories ORDER BY name").query(ROW).list();
    }

    @Override
    public List<Category> findAllById(Collection<Long> ids) {
        if (ids.isEmpty()) return List.of();
        return jdbc.sql("SELECT " + COLUMNS + " FROM categories WHERE id IN (:ids)").param("ids", ids).query(ROW).list();
    }

    @Override
    public Optional<Category> findById(Long id) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM categories WHERE id = :id").param("id", id).query(ROW).optional();
    }

    @Override
    public Optional<Category> findByName(String name) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM categories WHERE lower(name) = lower(:name)").param("name", name).query(ROW).optional();
    }

    @Override
    public Optional<Category> findBySlug(String slug) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM categories WHERE slug = :slug").param("slug", slug).query(ROW).optional();
    }

    @Override
    public Category save(Category category) {
        if (category.getId() == null) {
            Long id = jdbc.sql("INSERT INTO categories (name, slug, description) VALUES (:name, :slug, :description) RETURNING id")
                    .param("name", category.getName()).param("slug", category.getSlug()).param("description", category.getDescription())
                    .query(Long.class).single();
            return category.toBuilder().id(id).build();
        }
        jdbc.sql("UPDATE categories SET name = :name, slug = :slug, description = :description WHERE id = :id")
                .param("name", category.getName()).param("slug", category.getSlug()).param("description", category.getDescription())
                .param("id", category.getId()).update();
        return category.toBuilder().build();
    }

    @Override
    public boolean delete(Long id) {
        try {
            jdbc.sql("DELETE FROM categories WHERE id = :id").param("id", id).update();
            return true;
        } catch (DataIntegrityViolationException stillUsed) {
            return false;
        }
    }
}
