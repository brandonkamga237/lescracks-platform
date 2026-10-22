package com.brandonkamga.lescracks.identity.infra;

import com.brandonkamga.lescracks.support.PostgresIT;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.session.Session;
import org.springframework.session.SessionRepository;
import org.springframework.session.jdbc.JdbcIndexedSessionRepository;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class SessionStoreIT extends PostgresIT {

    @Autowired
    private JdbcIndexedSessionRepository sessions;

    @Test
    void keepsSessionsInPostgresForThirtyDays() {
        roundTrip(sessions);
    }

    // JdbcSession is package-private, so the round trip is written against the public Session type.
    private <S extends Session> void roundTrip(SessionRepository<S> repository) {
        S session = repository.createSession();
        session.setAttribute("member", "marie@example.com");
        repository.save(session);

        S stored = repository.findById(session.getId());

        assertThat(stored).isNotNull();
        assertThat(stored.<String>getAttribute("member")).isEqualTo("marie@example.com");
        assertThat(stored.getMaxInactiveInterval()).isEqualTo(Duration.ofDays(30));
        repository.deleteById(session.getId());
    }
}
