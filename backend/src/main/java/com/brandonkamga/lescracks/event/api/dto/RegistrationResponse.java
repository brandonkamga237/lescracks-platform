package com.brandonkamga.lescracks.event.api.dto;

import com.brandonkamga.lescracks.event.domain.EventRegistration;
import com.brandonkamga.lescracks.event.domain.RegistrationStatus;

import java.time.Instant;

/** The signed-in member's place on an event; registered is false when there is none. */
public record RegistrationResponse(boolean registered, RegistrationStatus status, Instant registeredAt) {

    public static RegistrationResponse of(EventRegistration registration) {
        return new RegistrationResponse(true, registration.getStatus(), registration.getCreatedAt());
    }

    public static RegistrationResponse none() {
        return new RegistrationResponse(false, null, null);
    }
}
