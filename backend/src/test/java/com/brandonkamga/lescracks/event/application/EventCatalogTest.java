package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventFormat;
import com.brandonkamga.lescracks.event.domain.model.EventStatus;
import com.brandonkamga.lescracks.event.domain.model.EventType;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.paging.PageQuery;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EventCatalogTest {

    private final InMemoryEvents.Events events = new InMemoryEvents.Events();
    private final InMemoryEvents.Engagement engagement = new InMemoryEvents.Engagement();
    private final EventCatalogImpl catalog = new EventCatalogImpl(events, new EventViews(engagement));
    private final Instant now = Instant.now();

    private Event event(String slug, EventStatus status, Instant start, Instant end) {
        return events.add(Event.builder().slug(slug).title(slug).description("D").type(EventType.HACKATHON).format(EventFormat.ONLINE)
                .status(status).startDate(start).endDate(end).build());
    }

    @Test
    @DisplayName("a draft is a 404 for visitors, by slug or by id, yet other modules still read it")
    void hidesDrafts() {
        Event draft = event("brouillon", EventStatus.DRAFT, now.plus(1, ChronoUnit.DAYS), null);

        assertThatThrownBy(() -> catalog.requirePublished("brouillon")).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> catalog.requirePublished(String.valueOf(draft.getId()))).isInstanceOf(NotFoundException.class);
        assertThat(catalog.require(draft.getId()).getSlug()).isEqualTo("brouillon");
    }

    @Test
    @DisplayName("an event that started but has not ended is still upcoming; the past runs latest first")
    void upcomingAndPast() {
        Event running = event("en-cours", EventStatus.PUBLISHED, now.minus(2, ChronoUnit.DAYS), now.plus(5, ChronoUnit.DAYS));
        Event next = event("prochain", EventStatus.PUBLISHED, now.plus(3, ChronoUnit.DAYS), null);
        Event old = event("ancien", EventStatus.PUBLISHED, now.minus(60, ChronoUnit.DAYS), null);
        Event older = event("plus-ancien", EventStatus.PUBLISHED, now.minus(90, ChronoUnit.DAYS), now.minus(89, ChronoUnit.DAYS));
        engagement.counts.put(Target.event(running.getId()), new Counts(8, 0));

        var upcoming = catalog.listUpcoming(new PageQuery(0, 10)).items();
        assertThat(upcoming).extracting(view -> view.event().getId()).containsExactly(running.getId(), next.getId());
        assertThat(upcoming.get(0).counts().views()).isEqualTo(8);
        assertThat(catalog.listPast(new PageQuery(0, 10)).items()).extracting(view -> view.event().getId())
                .containsExactly(old.getId(), older.getId());
    }

    @Test
    @DisplayName("an old numeric link still resolves once the event has a slug")
    void fallsBackFromSlugToId() {
        Event published = event("hackathon-001", EventStatus.PUBLISHED, now.plus(1, ChronoUnit.DAYS), null);

        assertThat(catalog.requirePublished(String.valueOf(published.getId())).event().getSlug()).isEqualTo("hackathon-001");
    }
}
