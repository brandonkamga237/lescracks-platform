package com.brandonkamga.lescracks.schema;

import com.brandonkamga.lescracks.support.PostgresIT;
import jakarta.persistence.EntityManager;
import jakarta.persistence.metamodel.EntityType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The cheapest test in the suite and the one that catches the most.
 *
 * Booting at all means Flyway applied the migrations and Hibernate validated every entity
 * against them, so a renamed column or a field shipped without a migration fails here
 * rather than on the server. The assertions below only name what the boot proved.
 */
class SchemaMatchesEntitiesIT extends PostgresIT {

    @Autowired
    EntityManager entities;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    @DisplayName("every entity maps onto a table the migrations created")
    void entitiesMatchTheMigratedSchema() {
        List<String> mapped = entities.getMetamodel().getEntities().stream()
                .map(EntityType::getName)
                .sorted()
                .toList();

        assertThat(mapped).isNotEmpty();
    }

    @Test
    @DisplayName("V1 is the only migration, and it applied")
    void migrationsApplied() {
        List<String> versions = jdbc.queryForList(
                "SELECT version FROM flyway_schema_history WHERE success ORDER BY installed_rank",
                String.class);

        assertThat(versions).containsExactly("1");
    }

    @Test
    @DisplayName("the rules live in the database, not only in Java")
    void schemaCarriesItsOwnRules() {
        Integer checks = jdbc.queryForObject("""
                SELECT count(*) FROM pg_constraint c
                JOIN pg_class t ON t.oid = c.conrelid
                JOIN pg_namespace n ON n.oid = t.relnamespace
                WHERE n.nspname = 'public' AND c.contype = 'c'
                """, Integer.class);

        // Partial indexes are how "only one active participation" is enforced; a plain
        // unique index would forbid ever enrolling again after abandoning.
        Integer partialUnique = jdbc.queryForObject("""
                SELECT count(*) FROM pg_indexes
                WHERE schemaname = 'public' AND indexdef LIKE '%UNIQUE%' AND indexdef LIKE '%WHERE%'
                """, Integer.class);

        assertThat(checks).isGreaterThanOrEqualTo(18);
        assertThat(partialUnique).isGreaterThanOrEqualTo(2);
    }
}
