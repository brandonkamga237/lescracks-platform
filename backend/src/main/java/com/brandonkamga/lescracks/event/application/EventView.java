package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;

/** An event with its audience, as cards and pages show it. */
public record EventView(Event event, Counts counts) {
}
