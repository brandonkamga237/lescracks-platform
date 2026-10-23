package com.brandonkamga.lescracks.recognition.api.dto;

import com.brandonkamga.lescracks.recognition.application.BadgeGrant;

import jakarta.validation.constraints.Size;

import java.util.List;

/** Pasted emails, an event, or both; at least one of them. */
public record BulkAwardRequest(@Size(max = 500) List<@Size(max = 254) String> emails, Long eventId, boolean presentOnly,
                               @Size(max = 300) String reason) {

    public BadgeGrant toGrant() {
        return new BadgeGrant(emails, eventId, presentOnly, reason);
    }
}
