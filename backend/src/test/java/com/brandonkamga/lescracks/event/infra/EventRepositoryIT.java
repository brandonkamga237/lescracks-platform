package com.brandonkamga.lescracks.event.infra;

import com.brandonkamga.lescracks.event.domain.Event;
import com.brandonkamga.lescracks.event.domain.EventFormat;
import com.brandonkamga.lescracks.event.domain.EventStatus;
import com.brandonkamga.lescracks.event.domain.EventType;
import com.brandonkamga.lescracks.support.PostgresIT;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

/** Which events are ahead and which are behind, against real PostgreSQL. */
@Transactional
class EventRepositoryIT extends PostgresIT {

    @Autowired private EventRepository events;

    private static final PageRequest ALL = PageRequest.of(0, 50);
    private final Instant now = Instant.now();

    private Event save(String title, Instant start, Instant end) {
        return events.saveAndFlush(Event.builder()
                .title(title).slug(title.toLowerCase().replace(' ', '-')).description("Description")
                .type(EventType.WORKSHOP).format(EventFormat.ONLINE)
                .startDate(start).endDate(end).status(EventStatus.PUBLISHED).build());
    }

    private Instant days(long count) {
        return now.plus(count, ChronoUnit.DAYS);
    }

    @Test
    @DisplayName("an event that has started but not ended is upcoming, not past")
    void anOngoingEventIsUpcoming() {
        save("En cours", days(-3), days(10));
        save("A venir", days(2), null);
        save("Fini", days(-10), days(-9));
        save("Passe sans fin", days(-5), null);

        assertThat(events.findUpcoming(EventStatus.PUBLISHED, now, ALL).getContent())
                .extracting(Event::getTitle).containsExactly("En cours", "A venir");
        assertThat(events.findPast(EventStatus.PUBLISHED, now, ALL).getContent())
                .extracting(Event::getTitle).containsExactly("Passe sans fin", "Fini");
    }

}
