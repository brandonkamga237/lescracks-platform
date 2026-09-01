package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.EventKind;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;

/**
 * Bootcamps and workshops: created for a date, held, then past.
 *
 * Nothing here computes a status. An event's phase is read from its dates by the entity
 * itself, so a stored status can never disagree with the date beside it.
 */
public interface EventService {

    /**
     * What the public sees. A null kind means both. {@code upcomingOnly} narrows to events
     * still to come and flips the order to soonest-first, which is the only order that reads
     * correctly when the list is a countdown rather than an archive.
     */
    Page<Event> published(EventKind kind, boolean upcomingOnly, Pageable pageable);

    Page<Event> all(Pageable pageable);

    Event requireBySlug(String slug);

    Event require(Long id);

    Event create(EventDraft draft);

    Event update(Long id, EventDraft draft);

    /** Publishing is what makes an event visible; it is deliberate, never a side effect. */
    Event setPublished(Long id, boolean published);

    void delete(Long id);

    /**
     * Everything an event is described by. A record rather than eight parameters: a caller
     * cannot transpose two of them by accident, and adding a field does not touch signatures.
     */
    record EventDraft(
            EventKind kind,
            String title,
            String summary,
            String description,
            Instant startsAt,
            Instant endsAt,
            String location,
            Integer capacity,
            Long coverId) {
    }
}
