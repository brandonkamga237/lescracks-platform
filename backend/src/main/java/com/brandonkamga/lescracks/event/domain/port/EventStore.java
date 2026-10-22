package com.brandonkamga.lescracks.event.domain.port;

import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventSearch;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EventStore {

    Optional<Event> findById(Long id);

    Optional<Event> findBySlug(String slug);

    boolean slugTaken(String slug);

    /** Soonest first, or latest first when the search asks; {@code now} places the upcoming/past boundary. */
    Paged<Event> search(EventSearch search, PageQuery page, Instant now);

    List<Event> findAllById(Collection<Long> ids);

    List<Long> findScheduledIds(Instant now);

    /** Leaves registration_count alone: only the registration SQL writes it. */
    Event save(Event event);

    void delete(Long id);
}
