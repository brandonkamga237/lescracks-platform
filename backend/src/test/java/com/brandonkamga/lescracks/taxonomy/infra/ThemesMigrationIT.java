package com.brandonkamga.lescracks.taxonomy.infra;

import com.brandonkamga.lescracks.support.PostgresIT;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * V25 rewrites production data (67 categories into 9 themes, tags merged and detached), and
 * cannot be undone. This replays it on a V24 database holding the cases that matter: duplicate
 * tags across categories, an unused tag, an admin-made category, overlapping interests.
 */
class ThemesMigrationIT extends PostgresIT {

    @Autowired private Flyway flyway;
    @Autowired private JdbcTemplate jdbc;

    @AfterEach
    void restoreTheSchema() {
        resetSchema();
    }

    private long category(String name, String slug) {
        return jdbc.queryForObject("insert into categories (name, slug) values (?, ?) returning id", Long.class, name, slug);
    }

    private long tag(long categoryId, String name) {
        return jdbc.queryForObject("insert into tags (category_id, name) values (?, ?) returning id", Long.class, categoryId, name);
    }

    private long article(long categoryId, String title) {
        return jdbc.queryForObject("""
                insert into resources (category_id, title, slug, description, cover_image, status)
                values (?, ?, ?, 'Description', 'https://cdn.example/c.png', 'PUBLISHED') returning id
                """, Long.class, categoryId, title, title.toLowerCase().replace(' ', '-'));
    }

    private long themeOf(long resourceId) {
        return jdbc.queryForObject("select category_id from resources where id = ?", Long.class, resourceId);
    }

    private long themeId(String name) {
        return jdbc.queryForObject("select id from categories where name = ?", Long.class, name);
    }

    @Test
    @DisplayName("categories fold into the nine themes, tags merge by name and lose their category")
    void foldsCategoriesAndTags() {
        flyway.clean();
        Flyway.configure().configuration(flyway.getConfiguration()).target("24").load().migrate();

        long frontend = category("Frontend", "frontend");
        long backend = category("Backend", "backend");
        long python = category("Python", "python");
        long custom = category("Ma catégorie", "ma-categorie");
        long web = category("Développement web", "developpement-web");
        long apiInFrontend = tag(frontend, "API");
        long apiInBackend = tag(backend, "api");
        tag(python, "Jamais utilisé");
        long first = article(frontend, "Un article");
        long second = article(backend, "Un autre");
        long third = article(custom, "Le dernier");
        jdbc.update("insert into resource_tags (resource_id, tag_id) values (?, ?), (?, ?), (?, ?)",
                first, apiInFrontend, second, apiInBackend, second, apiInFrontend);
        // Plain SQL, not the User entity: the entity follows the latest schema, this database stops at V24.
        long member = jdbc.queryForObject("insert into users (email, first_name, last_name, status) values ('awa@example.com', 'Awa', 'D', 'ACTIVE') returning id", Long.class);
        jdbc.update("insert into user_interests (user_id, category_id) values (?, ?), (?, ?)", member, frontend, member, web);

        flyway.migrate();

        assertThat(jdbc.queryForList("select name from categories order by name", String.class)).containsExactlyInAnyOrder(
                "Développement web", "Backend & bases de données", "Mobile", "Data & IA", "DevOps & Cloud", "Cybersécurité",
                "Architecture & qualité", "Fondamentaux & langages", "Carrière tech");
        assertThat(themeOf(first)).isEqualTo(themeId("Développement web")).isEqualTo(web);
        assertThat(themeOf(second)).isEqualTo(themeId("Backend & bases de données"));
        assertThat(themeOf(third)).as("an unknown category lands in the fallback theme").isEqualTo(themeId("Fondamentaux & langages"));

        List<String> tagNames = jdbc.queryForList("select name from tags", String.class);
        assertThat(tagNames).containsExactly("API");
        assertThat(jdbc.queryForObject("select count(*) from resource_tags where resource_id = ?", Long.class, second)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select count(*) from resource_tags where resource_id = ?", Long.class, first)).isEqualTo(1);

        assertThat(jdbc.queryForList("select category_id from user_interests where user_id = ?", Long.class, member))
                .containsExactly(web);
    }
}
