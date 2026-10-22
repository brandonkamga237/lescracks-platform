package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventSearch;
import com.brandonkamga.lescracks.event.domain.port.EventStore;
import com.brandonkamga.lescracks.engagement.application.EngagementCounts;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.newsletter.application.Announcements;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;
import com.brandonkamga.lescracks.shared.util.Slugs;
import com.brandonkamga.lescracks.storage.domain.CoverImages;
import com.brandonkamga.lescracks.storage.domain.StorageService;
import com.brandonkamga.lescracks.storage.domain.Upload;

import java.time.Instant;

public class EventAdminServiceImpl implements EventAdminService {
    private final EventStore events;
    private final EventViews views;
    private final StorageService storage;
    private final Announcements announcements;
    private final EngagementCounts engagement;

    public EventAdminServiceImpl(EventStore events, EventViews views, StorageService storage, Announcements announcements,
                                 EngagementCounts engagement) {
        this.events = events;
        this.views = views;
        this.storage = storage;
        this.announcements = announcements;
        this.engagement = engagement;
    }

    @Override
    public Paged<EventView> list(PageQuery page) {
        return views.of(events.search(EventSearch.backOffice(), page, Instant.now()));
    }

    @Override
    public EventView create(EventDraft draft, Upload cover) {
        Event event = Event.builder().build();
        apply(event, draft, CoverImages.resolveOptional(storage, cover, null, null));
        Event saved = events.save(event);
        if (saved.isPublished()) announcements.announceEvent(EventSchedule.newsOf(saved));
        return views.of(saved);
    }

    @Override
    public EventView update(Long id, EventDraft draft, Upload cover) {
        Event event = require(id);
        apply(event, draft, CoverImages.resolveOptional(storage, cover, null, event.getCoverImage()));
        event.setUpdatedAt(Instant.now());
        return views.of(events.save(event));
    }

    @Override
    public void delete(Long id) {
        Event event = require(id);
        CoverImages.discard(storage, event.getCoverImage());
        events.delete(id);
        engagement.forget(Target.event(id));
    }

    private void apply(Event event, EventDraft draft, String cover) {
        event.setTitle(draft.title().trim());
        event.setDescription(draft.description().trim());
        event.setType(draft.type());
        event.setFormat(draft.format());
        event.schedule(draft.startDate(), draft.endDate());
        event.setLocation(draft.location() == null || draft.location().isBlank() ? null : draft.location().trim());
        event.setAcceptsSubmissions(Boolean.TRUE.equals(draft.acceptsSubmissions()));
        event.setMaxTeamSize(draft.maxTeamSize() == null ? 1 : draft.maxTeamSize());
        event.setSubmissionDeadline(draft.submissionDeadline());
        event.plan(draft.status(), draft.scheduledAt());
        event.setCoverImage(cover);
        if (event.getSlug() == null || event.getSlug().isBlank()) {
            event.setSlug(Slugs.uniqueFrom(event.getTitle(), events::slugTaken));
        }
    }

    private Event require(Long id) {
        return events.findById(id).orElseThrow(() -> new NotFoundException("Event", "id", id));
    }
}
