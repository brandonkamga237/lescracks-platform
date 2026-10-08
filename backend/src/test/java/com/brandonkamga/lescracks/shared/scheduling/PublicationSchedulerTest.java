package com.brandonkamga.lescracks.shared.scheduling;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PublicationSchedulerTest {

    /** Due ids 1, 2 and 3: 2 fails to publish, 3 publishes but its announcement fails. */
    private static final class Flaky implements ScheduledPublishing {
        final List<Long> published = new ArrayList<>();
        final List<Long> announced = new ArrayList<>();

        @Override
        public List<Long> dueForPublication(Instant now) {
            return List.of(1L, 2L, 3L);
        }

        @Override
        public boolean publishScheduled(Long id, Instant now) {
            if (id == 2L) throw new IllegalStateException("database hiccup");
            published.add(id);
            return true;
        }

        @Override
        public void announce(Long id) {
            if (id == 3L) throw new IllegalStateException("mail server down");
            announced.add(id);
        }
    }

    private static final class NothingDue implements ScheduledPublishing {
        @Override
        public List<Long> dueForPublication(Instant now) {
            return List.of(5L);
        }

        @Override
        public boolean publishScheduled(Long id, Instant now) {
            return false;
        }
    }

    @Test
    @DisplayName("one failure never blocks the rest, and a failed announcement keeps the content published")
    void isolatesFailures() {
        Flaky flaky = new Flaky();

        int count = new PublicationScheduler(List.of(flaky, new NothingDue())).publishDue(Instant.now());

        assertThat(count).isEqualTo(2);
        assertThat(flaky.published).containsExactly(1L, 3L);
        assertThat(flaky.announced).containsExactly(1L);
    }
}
