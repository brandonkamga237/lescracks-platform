package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventFormat;
import com.brandonkamga.lescracks.event.domain.model.EventStatus;
import com.brandonkamga.lescracks.event.domain.model.EventType;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.storage.domain.Upload;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EventAdminServiceTest {

    private final InMemoryEvents.Events events = new InMemoryEvents.Events();
    private final InMemoryEvents.Engagement engagement = new InMemoryEvents.Engagement();
    private final InMemoryEvents.Newsletter newsletter = new InMemoryEvents.Newsletter();
    private final InMemoryEvents.Files files = new InMemoryEvents.Files();
    private final EventAdminService service = new EventAdminServiceImpl(events, new EventViews(engagement), files, newsletter, engagement);
    private final EventSchedule schedule = new EventSchedule(events, newsletter);

    private final Instant start = Instant.now().plus(10, ChronoUnit.DAYS);

    private EventDraft draft(EventStatus status, Instant scheduledAt, Instant end) {
        return new EventDraft("  Atelier React  ", " Découvrir React ", EventType.WORKSHOP, EventFormat.ONLINE, start, end,
                "  ", status, scheduledAt, null, null, null);
    }

    @Test
    @DisplayName("a published event is stored trimmed with its defaults, and the subscribers hear of it")
    void publishes() {
        Event saved = service.create(draft(EventStatus.PUBLISHED, null, null), null).event();

        Event stored = events.stored(saved.getId());
        assertThat(stored.getTitle()).isEqualTo("Atelier React");
        assertThat(stored.getSlug()).isEqualTo("atelier-react");
        assertThat(stored.getLocation()).isNull();
        assertThat(stored.getMaxTeamSize()).isEqualTo(1);
        assertThat(stored.isAcceptsSubmissions()).isFalse();
        assertThat(stored.getCoverImage()).isNull();
        assertThat(newsletter.events).extracting(news -> news.path()).containsExactly("/evenements/atelier-react");
    }

    @Test
    @DisplayName("a scheduled event waits as a draft and is announced only when the scheduler publishes it")
    void scheduledEventWaits() {
        Instant soon = Instant.now().plus(1, ChronoUnit.DAYS);
        Long id = service.create(draft(EventStatus.PUBLISHED, soon, null), null).event().getId();

        assertThat(events.stored(id).getStatus()).isEqualTo(EventStatus.DRAFT);
        assertThat(newsletter.events).isEmpty();

        Instant due = soon.plusSeconds(1);
        assertThat(schedule.dueForPublication(due)).containsExactly(id);
        assertThat(schedule.publishScheduled(id, due)).isTrue();
        schedule.announce(id);

        assertThat(events.stored(id).getStatus()).isEqualTo(EventStatus.PUBLISHED);
        assertThat(events.stored(id).getScheduledAt()).isNull();
        assertThat(newsletter.events).hasSize(1);
        assertThat(schedule.publishScheduled(id, due)).isFalse();
    }

    @Test
    @DisplayName("publishing after the event has started makes no sense and is refused, as is an end before the start")
    void datesAreChecked() {
        assertThatThrownBy(() -> service.create(draft(EventStatus.DRAFT, start.plusSeconds(60), null), null))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("précéder le début");
        assertThatThrownBy(() -> service.create(draft(EventStatus.DRAFT, null, start.minusSeconds(60)), null))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("fin");
        assertThat(service.list(new PageQuery(0, 10)).total()).isZero();
    }

    @Test
    @DisplayName("an update keeps the stored cover and slug, and never touches the registration counter")
    void updateKeepsWhatItDoesNotOwn() {
        Long id = service.create(draft(EventStatus.DRAFT, null, null), new Upload("c.png", "image/png", new byte[] {1})).event().getId();
        events.shift(id, 3);

        service.update(id, new EventDraft("Nouveau titre", "D", EventType.HACKATHON, EventFormat.HYBRID, start, null, "Douala",
                EventStatus.PUBLISHED, null, true, 3, null), null);

        Event stored = events.stored(id);
        assertThat(stored.getSlug()).isEqualTo("atelier-react");
        assertThat(stored.getCoverImage()).isEqualTo("/api/files/key-c.png");
        assertThat(stored.getRegistrationCount()).isEqualTo(3);
        assertThat(stored.getMaxTeamSize()).isEqualTo(3);
        assertThat(stored.isAcceptsSubmissions()).isTrue();
    }

    @Test
    @DisplayName("deleting drops our cover and the event's audience")
    void deletes() {
        Long id = service.create(draft(EventStatus.DRAFT, null, null), new Upload("c.png", "image/png", new byte[] {1})).event().getId();

        service.delete(id);

        assertThat(events.findById(id)).isEmpty();
        assertThat(files.deleted).containsExactly("key-c.png");
        assertThat(engagement.forgotten).containsExactly(Target.event(id));
    }
}
