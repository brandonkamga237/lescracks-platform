package com.brandonkamga.lescracks.support;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base class for every {@code *IT}: real PostgreSQL, real migrations, {@code ddl-auto: validate}
 * exactly as in production.
 *
 * The container is {@code static}: one database for the whole suite, not one per class. Starting
 * PostgreSQL costs seconds and paying that per class is how a suite stops being run. The price is
 * that state outlives a class, so **isolation is the subclass's job**:
 * <ul>
 *   <li>annotate the test class {@code @Transactional} — Spring rolls back after each test, which
 *       covers repository and service tests;</li>
 *   <li>when a rollback cannot work (code that commits, or a test asserting on committed state),
 *       call {@link #resetSchema()} and pay the rebuild only there.</li>
 * </ul>
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
public abstract class PostgresIT {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private Flyway flyway;

    /** Drops everything and replays the migrations from V1. Seconds, not milliseconds. */
    protected void resetSchema() {
        flyway.clean();
        flyway.migrate();
    }
}
