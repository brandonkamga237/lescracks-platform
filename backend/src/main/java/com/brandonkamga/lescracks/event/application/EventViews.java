package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.engagement.application.EngagementCounts;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/** Adds the audience of a whole page of events in one query. */
public class EventViews {
    private final EngagementCounts engagement;

    public EventViews(EngagementCounts engagement) {
        this.engagement = engagement;
    }

    public List<EventView> of(Collection<Event> events) {
        if (events.isEmpty()) return List.of();
        Map<Long, Counts> counts = engagement.countsOf(TargetType.EVENT, events.stream().map(Event::getId).toList());
        return events.stream().map(event -> new EventView(event, counts.getOrDefault(event.getId(), Counts.NONE))).toList();
    }

    public EventView of(Event event) {
        return of(List.of(event)).get(0);
    }

    public Paged<EventView> of(Paged<Event> page) {
        return new Paged<>(of(page.items()), page.page(), page.size(), page.total());
    }
}
