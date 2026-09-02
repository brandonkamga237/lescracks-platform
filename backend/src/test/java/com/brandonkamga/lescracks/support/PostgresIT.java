package com.brandonkamga.lescracks.support;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Base for every test that needs the real schema.
 *
 * One container for the whole suite, started once and never stopped: Ryuk removes it when
 * the JVM ends, and paying five seconds per test class would make the suite something
 * nobody runs. Flyway applies the real migrations into it, so these tests exercise the
 * schema production will have — jsonb columns and partial unique indexes included, neither
 * of which H2 can represent.
 */
@SpringBootTest
@ActiveProfiles("test")
public abstract class PostgresIT {

    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
}
