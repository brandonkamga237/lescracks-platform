package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.EventKind;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.EventRepository;
import com.brandonkamga.lescracks.service.interfaces.EventService;
import com.brandonkamga.lescracks.service.interfaces.MediaService;
import com.brandonkamga.lescracks.util.Slugs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@Transactional
public class EventServiceImpl implements EventService {

    private final EventRepository events;
    private final MediaService media;

    public EventServiceImpl(EventRepository events, MediaService media) {
        this.events = events;
        this.media = media;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Event> published(EventKind kind, boolean upcomingOnly, Pageable pageable) {
        return upcomingOnly
                ? events.findUpcoming(Instant.now(), kind, pageable)
                : events.findPublished(kind, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Event> all(Pageable pageable) {
        return events.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Event requireBySlug(String slug) {
        return events.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Event", "slug", slug));
    }

    @Override
    @Transactional(readOnly = true)
    public Event require(Long id) {
        return events.findById(id)
                .orElseThrow(() -> new NotFoundException("Event", "id", id));
    }

    @Override
    public Event create(EventDraft draft) {
        validate(draft);
        Event event = Event.builder()
                .slug(Slugs.uniqueFrom(draft.title(), events::existsBySlug))
                .build();
        apply(event, draft);
        return events.save(event);
    }

    @Override
    public Event update(Long id, EventDraft draft) {
        validate(draft);
        Event event = require(id);
        // The slug is left alone on purpose: it is in links people have already shared.
        apply(event, draft);
        return event;
    }

    /** One place that turns a draft into an event, so create and update cannot drift apart. */
    private void apply(Event event, EventDraft draft) {
        event.setKind(draft.kind());
        event.setTitle(draft.title().strip());
        event.setSummary(draft.summary());
        event.setDescription(draft.description());
        event.setStartsAt(draft.startsAt());
        event.setEndsAt(draft.endsAt());
        event.setLocation(draft.location());
        event.setCapacity(draft.capacity());
        event.setCover(draft.coverId() == null ? null : media.require(draft.coverId()));
    }

    /** What the database also refuses, said early and in words the admin can act on. */
    private void validate(EventDraft draft) {
        if (draft.kind() == null) {
            throw new BadRequestException("Précisez s'il s'agit d'un bootcamp ou d'un workshop.");
        }
        if (draft.title() == null || draft.title().isBlank()) {
            throw new BadRequestException("Le titre est obligatoire.");
        }
        if (draft.startsAt() == null) {
            throw new BadRequestException("La date de début est obligatoire.");
        }
        if (draft.endsAt() != null && draft.endsAt().isBefore(draft.startsAt())) {
            throw new BadRequestException("La date de fin ne peut pas précéder la date de début.");
        }
        if (draft.capacity() != null && draft.capacity() <= 0) {
            throw new BadRequestException("La capacité doit être supérieure à zéro, ou vide si illimitée.");
        }
    }

    @Override
    public Event setPublished(Long id, boolean published) {
        Event event = require(id);
        event.setPublished(published);
        return event;
    }

    @Override
    public void delete(Long id) {
        events.delete(require(id));
    }
}
