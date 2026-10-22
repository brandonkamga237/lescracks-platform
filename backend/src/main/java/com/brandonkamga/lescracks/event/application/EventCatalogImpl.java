package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventFormat;
import com.brandonkamga.lescracks.event.domain.model.EventSearch;
import com.brandonkamga.lescracks.event.domain.model.EventType;
import com.brandonkamga.lescracks.event.domain.port.EventStore;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public class EventCatalogImpl implements EventCatalog, EventDirectory {
    private static final int ALL = 10_000;

    private final EventStore events;
    private final EventViews views;

    public EventCatalogImpl(EventStore events, EventViews views) {
        this.events = events;
        this.views = views;
    }

    @Override
    public Paged<EventView> search(EventType type, EventFormat format, PageQuery page) {
        return views.of(events.search(EventSearch.published(type, format), page, Instant.now()));
    }

    @Override
    public Paged<EventView> listUpcoming(PageQuery page) {
        return views.of(events.search(EventSearch.upcoming(), page, Instant.now()));
    }

    @Override
    public Paged<EventView> listPast(PageQuery page) {
        return views.of(events.search(EventSearch.past(), page, Instant.now()));
    }

    @Override
    public EventView requirePublished(String slugOrId) {
        return find(slugOrId).filter(Event::isPublished).map(views::of)
                .orElseThrow(() -> new NotFoundException("Event", "slug", slugOrId));
    }

    @Override
    public List<Event> listPublished() {
        return events.search(EventSearch.published(null, null), new PageQuery(0, ALL), Instant.now()).items();
    }

    @Override
    public Event require(Long id) {
        return events.findById(id).orElseThrow(() -> new NotFoundException("Event", "id", id));
    }

    private Optional<Event> find(String slugOrId) {
        if (slugOrId == null || slugOrId.isBlank()) return Optional.empty();
        return events.findBySlug(slugOrId).or(() -> parseId(slugOrId).flatMap(events::findById));
    }

    private static Optional<Long> parseId(String value) {
        try {
            return Optional.of(Long.parseLong(value));
        } catch (NumberFormatException notAnId) {
            return Optional.empty();
        }
    }
}
