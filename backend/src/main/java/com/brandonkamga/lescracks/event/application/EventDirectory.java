package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.Event;

/** How other modules read an event whatever its status, for work done after it (certificates, badges). */
public interface EventDirectory {

    Event require(Long id);
}
