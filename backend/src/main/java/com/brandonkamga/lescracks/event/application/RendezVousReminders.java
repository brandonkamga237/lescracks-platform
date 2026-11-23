package com.brandonkamga.lescracks.event.application;

import java.time.Instant;

/** Emails the members who asked to be reminded of a rendez-vous, the day before and an hour before. */
public interface RendezVousReminders {

    /** Sends every reminder due at {@code now}, each one once; returns how many emails went out. */
    int sendDue(Instant now);
}
