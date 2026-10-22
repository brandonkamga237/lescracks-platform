package com.brandonkamga.lescracks.event.infra.engagement;

import com.brandonkamga.lescracks.engagement.application.ContentTargets;
import com.brandonkamga.lescracks.engagement.application.TargetPage;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.event.domain.Event;
import com.brandonkamga.lescracks.event.domain.EventStatus;
import com.brandonkamga.lescracks.event.infra.EventRepository;

import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

/** Events as engagement targets. Repository only: the event service reads engagement's counts. */
@Component
class EventTargets implements ContentTargets {

    private final EventRepository events;

    EventTargets(EventRepository events) {
        this.events = events;
    }

    @Override
    public TargetType type() {
        return TargetType.EVENT;
    }

    @Override
    public boolean isOpen(Long id) {
        return events.findById(id).map(event -> event.getStatus() == EventStatus.PUBLISHED).orElse(false);
    }

    @Override
    public Map<Long, TargetPage> describe(Collection<Long> ids) {
        return events.findAllById(ids).stream().collect(Collectors.toMap(Event::getId, event -> new TargetPage(
                event.getId(), event.getTitle(), "/evenements/" + (event.getSlug() == null || event.getSlug().isBlank()
                        ? event.getId() : event.getSlug()))));
    }
}
