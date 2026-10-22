package com.brandonkamga.lescracks.event.api.dto;

import com.brandonkamga.lescracks.event.domain.model.Registration;
import com.brandonkamga.lescracks.event.domain.model.RegistrationStatus;

import java.time.Instant;

/** The signed-in member's place on an event; registered is false when there is none. */
public record RegistrationResponse(boolean registered, RegistrationStatus status, Instant registeredAt) {

    public static RegistrationResponse of(Registration registration) {
        return new RegistrationResponse(true, registration.getStatus(), registration.getCreatedAt());
    }

    public static RegistrationResponse none() {
        return new RegistrationResponse(false, null, null);
    }
}
