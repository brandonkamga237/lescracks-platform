package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.port.EventStore;
import com.brandonkamga.lescracks.newsletter.application.Announcements;
import com.brandonkamga.lescracks.newsletter.application.EventNews;
import com.brandonkamga.lescracks.shared.scheduling.ScheduledPublishing;

import java.time.Instant;
import java.util.List;

/** Events drafted ahead, published by the scheduler when their date comes. */
public class EventSchedule implements ScheduledPublishing {
    private final EventStore events;
    private final Announcements announcements;

    public EventSchedule(EventStore events, Announcements announcements) {
        this.events = events;
        this.announcements = announcements;
    }

    @Override
    public List<Long> dueForPublication(Instant now) {
        return events.findScheduledIds(now);
    }

    @Override
    public boolean publishScheduled(Long id, Instant now) {
        Event event = events.findById(id).orElse(null);
        if (event == null || !event.publishOnSchedule(now)) return false;
        events.save(event);
        return true;
    }

    @Override
    public void announce(Long id) {
        events.findById(id).ifPresent(event -> announcements.announceEvent(newsOf(event)));
    }

    static EventNews newsOf(Event event) {
        return new EventNews(event.getTitle(), event.getDescription(), event.path(), event.getCoverImage(), event.getStartDate());
    }
}
