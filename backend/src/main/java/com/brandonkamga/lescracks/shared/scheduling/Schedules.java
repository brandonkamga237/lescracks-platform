package com.brandonkamga.lescracks.shared.scheduling;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import java.time.Instant;

public final class Schedules {

    private Schedules() {
    }

    /**
     * The publication date to keep. A past date is refused, except the one already stored: saving
     * a draft a few seconds after its time has come must not fail, the scheduler publishes it next.
     */
    public static Instant check(Instant requested, Instant current) {
        if (requested == null || requested.isAfter(Instant.now()) || requested.equals(current)) {
            return requested;
        }
        throw new BadRequestException("La date de publication programmée doit être dans le futur.");
    }
}
