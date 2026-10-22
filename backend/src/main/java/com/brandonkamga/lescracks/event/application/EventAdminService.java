package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;
import com.brandonkamga.lescracks.storage.domain.Upload;

/** Events as the back office manages them, drafts included. */
public interface EventAdminService {

    /** Latest start first. */
    Paged<EventView> list(PageQuery page);

    /** Subscribers hear of it when it is published straight away. */
    EventView create(EventDraft draft, Upload cover);

    EventView update(Long id, EventDraft draft, Upload cover);

    /** Takes its cover, registrations, projects and audience with it. */
    void delete(Long id);
}
