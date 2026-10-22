package com.brandonkamga.lescracks.event.infra.engagement;

import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.port.EventStore;
import com.brandonkamga.lescracks.engagement.application.ContentTargets;
import com.brandonkamga.lescracks.engagement.application.TargetPage;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;

import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

/** Events as engagement targets. Store only: the event services read engagement's counts. */
@Component
class EventTargets implements ContentTargets {

    private final EventStore events;

    EventTargets(EventStore events) {
        this.events = events;
    }

    @Override
    public TargetType type() {
        return TargetType.EVENT;
    }

    @Override
    public boolean isOpen(Long id) {
        return events.findById(id).map(Event::isPublished).orElse(false);
    }

    @Override
    public Map<Long, TargetPage> describe(Collection<Long> ids) {
        return events.findAllById(ids).stream()
                .collect(Collectors.toMap(Event::getId, event -> new TargetPage(event.getId(), event.getTitle(), event.path())));
    }
}
