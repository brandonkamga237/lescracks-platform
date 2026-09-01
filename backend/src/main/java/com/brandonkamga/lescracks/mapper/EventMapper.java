package com.brandonkamga.lescracks.mapper;

import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.dto.event.EventDetail;
import com.brandonkamga.lescracks.dto.event.EventPhase;
import com.brandonkamga.lescracks.dto.event.EventSummary;
import org.springframework.stereotype.Component;

@Component
public class EventMapper {

    private final MediaMapper mediaMapper;

    public EventMapper(MediaMapper mediaMapper) {
        this.mediaMapper = mediaMapper;
    }

    public EventSummary toSummary(Event event) {
        return new EventSummary(
                event.getId(), event.getSlug(), event.getKind(), event.getTitle(),
                event.getSummary(), event.getStartsAt(), event.getEndsAt(), event.getLocation(),
                mediaMapper.toResponse(event.getCover()), phaseOf(event), event.isPublished());
    }

    public EventDetail toDetail(Event event) {
        return new EventDetail(
                event.getId(), event.getSlug(), event.getKind(), event.getTitle(),
                event.getSummary(), event.getDescription(), event.getStartsAt(), event.getEndsAt(),
                event.getLocation(), event.getCapacity(), mediaMapper.toResponse(event.getCover()),
                phaseOf(event), event.isPublished(),
                event.isPublished() && !event.isPast());
    }

    /**
     * Computed here rather than stored, so it can never disagree with the dates. Doing it once
     * also stops each client reimplementing the comparison, with its own idea of a timezone.
     */
    private EventPhase phaseOf(Event event) {
        if (event.isUpcoming()) {
            return EventPhase.UPCOMING;
        }
        return event.isPast() ? EventPhase.PAST : EventPhase.RUNNING;
    }
}
