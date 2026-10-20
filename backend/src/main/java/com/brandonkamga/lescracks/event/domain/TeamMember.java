package com.brandonkamga.lescracks.event.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** Someone named on a project. The event id travels along so the database refuses one person on two projects. */
@Embeddable
public record TeamMember(
        @Column(name = "user_id", nullable = false) Long userId,
        @Column(name = "event_id", nullable = false) Long eventId) {
}
