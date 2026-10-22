package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.Registration;

/** An event the member signed up for, as their account lists it. */
public record MyEvent(Registration registration, Event event) {
}
