package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventFormat;
import com.brandonkamga.lescracks.event.domain.model.EventType;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.util.List;

/** Published events, as visitors browse them. */
public interface EventCatalog {

    /** Soonest first. */
    Paged<EventView> search(EventType type, EventFormat format, PageQuery page);

    /** Not over yet, soonest first. */
    Paged<EventView> listUpcoming(PageQuery page);

    /** Over, latest first. */
    Paged<EventView> listPast(PageQuery page);

    /** By slug or by the numeric id older links carry; a draft is a 404. */
    EventView requirePublished(String slugOrId);

    /** Every published event, without audience: the sitemap. */
    List<Event> listPublished();
}
