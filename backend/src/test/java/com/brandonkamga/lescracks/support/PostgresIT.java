package com.brandonkamga.lescracks.support;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Base class for every {@code *IT}: real PostgreSQL, real migrations, {@code ddl-auto: validate}
 * exactly as in production.
 *
 * The container is started once per JVM, in a static block, and never stopped by JUnit: one
 * database for the whole suite, not one per class. Starting PostgreSQL costs seconds and paying
 * that per class is how a suite stops being run. It must not be a JUnit {@code @Container}
 * either: that stops it after each class, while Spring keeps the cached application context
 * pointing at the stopped one, and the next class fails on "connection refused". Ryuk removes
 * the container when the JVM exits. The price is that state outlives a class, so **isolation
 * is the subclass's job**:
 * <ul>
 *   <li>annotate the test class {@code @Transactional} — Spring rolls back after each test, which
 *       covers repository and service tests;</li>
 *   <li>when a rollback cannot work (code that commits, or a test asserting on committed state),
 *       call {@link #resetSchema()} and pay the rebuild only there.</li>
 * </ul>
 */
@SpringBootTest
@ActiveProfiles("test")
public abstract class PostgresIT {

    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    static {
        POSTGRES.start();
    }

    @Autowired
    private Flyway flyway;

    /** Drops everything and replays the migrations from V1. Seconds, not milliseconds. */
    protected void resetSchema() {
        flyway.clean();
        flyway.migrate();
    }
}
