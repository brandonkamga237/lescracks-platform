package com.brandonkamga.lescracks.event.api.dto;

import com.brandonkamga.lescracks.event.domain.EventRegistration;
import com.brandonkamga.lescracks.event.domain.RegistrationStatus;

import java.time.Instant;

/** An event the member signed up for, as their account lists it. */
public record MyEventResponse(Long id, String slug, String title, String type, Instant startDate, Instant endDate,
                              RegistrationStatus status) {

    public static MyEventResponse of(EventRegistration registration) {
        var event = registration.getEvent();
        return new MyEventResponse(event.getId(), event.getSlug(), event.getTitle(), event.getType().name(),
                event.getStartDate(), event.getEndDate(), registration.getStatus());
    }
}
