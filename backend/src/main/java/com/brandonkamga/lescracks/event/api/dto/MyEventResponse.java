package com.brandonkamga.lescracks.event.api.dto;

import com.brandonkamga.lescracks.event.application.MyEvent;
import com.brandonkamga.lescracks.event.domain.model.RegistrationStatus;

import java.time.Instant;

/** An event the member signed up for, as their account lists it. */
public record MyEventResponse(Long id, String slug, String title, String type, Instant startDate, Instant endDate,
                              RegistrationStatus status) {

    public static MyEventResponse of(MyEvent mine) {
        var event = mine.event();
        return new MyEventResponse(event.getId(), event.getSlug(), event.getTitle(), event.getType().name(),
                event.getStartDate(), event.getEndDate(), mine.registration().getStatus());
    }
}
