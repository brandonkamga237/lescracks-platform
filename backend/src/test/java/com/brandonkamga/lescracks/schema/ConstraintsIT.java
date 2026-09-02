package com.brandonkamga.lescracks.schema;

import com.brandonkamga.lescracks.support.PostgresIT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The rules the schema enforces itself.
 *
 * Written against SQL rather than the repositories on purpose: these guard against writes
 * that never go through a service — a migration, a fix applied by hand, a future endpoint
 * whose author has not read the domain. A rule only the Java layer knows is not a rule.
 *
 * Every test asserts the refusal *and* the legitimate case beside it, because a constraint
 * that rejects everything passes half a test suite while breaking the product.
 */
class ConstraintsIT extends PostgresIT {

    @Autowired
    JdbcTemplate jdbc;

    @BeforeEach
    void reset() {
        jdbc.execute("TRUNCATE participations, applications, events, users RESTART IDENTITY CASCADE");
        jdbc.update("INSERT INTO users (subject, email, display_name) VALUES ('kc-1', 'ada@lescracks.test', 'Ada')");
        jdbc.update("""
                INSERT INTO events (kind, slug, title, starts_at, published)
                VALUES ('BOOTCAMP', 'bootcamp-spring', 'Bootcamp Spring', now(), true)
                """);
    }

    private long userId() {
        return jdbc.queryForObject("SELECT id FROM users LIMIT 1", Long.class);
    }

    private long eventId() {
        return jdbc.queryForObject("SELECT id FROM events LIMIT 1", Long.class);
    }

    @Test
    @DisplayName("the mentorship table holds exactly one row, for ever")
    void mentorshipStaysASingleton() {
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO mentorship (id, open, title) VALUES (2, false, 'Second')"))
                .isInstanceOf(DataIntegrityViolationException.class);

        assertThat(jdbc.queryForObject("SELECT count(*) FROM mentorship", Integer.class)).isEqualTo(1);
    }

    @Test
    @DisplayName("an event application without an event is refused")
    void eventApplicationNeedsItsEvent() {
        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO applications (target, full_name, email, status)
                VALUES ('EVENT', 'Ada', 'ada@lescracks.test', 'PENDING')
                """))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("a 360 application carrying an event is refused too")
    void mentorshipApplicationMustNotCarryAnEvent() {
        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO applications (target, event_id, full_name, email, status)
                VALUES ('MENTORSHIP', ?, 'Ada', 'ada@lescracks.test', 'PENDING')
                """, eventId()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("both legitimate applications are accepted")
    void acceptsBothWellFormedApplications() {
        assertThatCode(() -> {
            jdbc.update("""
                    INSERT INTO applications (target, event_id, full_name, email, status)
                    VALUES ('EVENT', ?, 'Ada', 'ada@lescracks.test', 'PENDING')
                    """, eventId());
            jdbc.update("""
                    INSERT INTO applications (target, full_name, email, status)
                    VALUES ('MENTORSHIP', 'Ada', 'ada@lescracks.test', 'PENDING')
                    """);
        }).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("a completed participation without its date is refused")
    void completedParticipationNeedsItsDate() {
        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO participations (user_id, target, event_id, status)
                VALUES (?, 'EVENT', ?, 'COMPLETED')
                """, userId(), eventId()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("an unfinished participation carrying a date is refused")
    void unfinishedParticipationMustNotBeDated() {
        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO participations (user_id, target, event_id, status, completed_at)
                VALUES (?, 'EVENT', ?, 'IN_PROGRESS', CURRENT_DATE)
                """, userId(), eventId()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("a completed participation with its date is accepted")
    void acceptsACompletedParticipationWithItsDate() {
        assertThatCode(() -> jdbc.update("""
                INSERT INTO participations (user_id, target, event_id, status, completed_at)
                VALUES (?, 'EVENT', ?, 'COMPLETED', CURRENT_DATE)
                """, userId(), eventId()))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("nobody enrols twice on the same event at the same time")
    void onlyOneActiveParticipationPerEvent() {
        jdbc.update("""
                INSERT INTO participations (user_id, target, event_id, status)
                VALUES (?, 'EVENT', ?, 'IN_PROGRESS')
                """, userId(), eventId());

        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO participations (user_id, target, event_id, status)
                VALUES (?, 'EVENT', ?, 'IN_PROGRESS')
                """, userId(), eventId()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("but somebody who abandoned may enrol again")
    void abandoningFreesTheSlot() {
        jdbc.update("""
                INSERT INTO participations (user_id, target, event_id, status)
                VALUES (?, 'EVENT', ?, 'ABANDONED')
                """, userId(), eventId());

        // The index is partial for exactly this: a plain unique index would close the door
        // on anyone who ever stopped.
        assertThatCode(() -> jdbc.update("""
                INSERT INTO participations (user_id, target, event_id, status)
                VALUES (?, 'EVENT', ?, 'IN_PROGRESS')
                """, userId(), eventId()))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("one pending 360 application per address, whatever the casing")
    void onePendingMentorshipApplicationPerEmail() {
        jdbc.update("""
                INSERT INTO applications (target, full_name, email, status)
                VALUES ('MENTORSHIP', 'Ada', 'ada@lescracks.test', 'PENDING')
                """);

        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO applications (target, full_name, email, status)
                VALUES ('MENTORSHIP', 'Ada', 'ADA@LesCracks.TEST', 'PENDING')
                """))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("a decided application does not block the next one")
    void aDecidedApplicationFreesTheAddress() {
        jdbc.update("""
                INSERT INTO applications (target, full_name, email, status, decided_at)
                VALUES ('MENTORSHIP', 'Ada', 'ada@lescracks.test', 'REJECTED', now())
                """);

        assertThatCode(() -> jdbc.update("""
                INSERT INTO applications (target, full_name, email, status)
                VALUES ('MENTORSHIP', 'Ada', 'ada@lescracks.test', 'PENDING')
                """))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("two people may hold a pending application at the same time")
    void differentAddressesDoNotCollide() {
        jdbc.update("""
                INSERT INTO applications (target, full_name, email, status)
                VALUES ('MENTORSHIP', 'Ada', 'ada@lescracks.test', 'PENDING')
                """);

        assertThatCode(() -> jdbc.update("""
                INSERT INTO applications (target, full_name, email, status)
                VALUES ('MENTORSHIP', 'Grace', 'grace@lescracks.test', 'PENDING')
                """))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("a slug identifies one resource and one event")
    void slugsAreUnique() {
        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO events (kind, slug, title, starts_at, published)
                VALUES ('WORKSHOP', 'bootcamp-spring', 'Autre', now(), true)
                """))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("an address identifies one account")
    void userEmailsAreUnique() {
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO users (subject, email, display_name) VALUES ('kc-2', 'ada@lescracks.test', 'Ada bis')"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("a Keycloak subject identifies one account")
    void userSubjectsAreUnique() {
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO users (subject, email, display_name) VALUES ('kc-1', 'other@lescracks.test', 'Autre')"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
