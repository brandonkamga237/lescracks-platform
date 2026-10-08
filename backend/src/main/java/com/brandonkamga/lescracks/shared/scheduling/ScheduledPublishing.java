package com.brandonkamga.lescracks.shared.scheduling;

import java.time.Instant;
import java.util.List;

/** A kind of content an admin can prepare ahead: a draft with a date, published by {@link PublicationScheduler}. */
public interface ScheduledPublishing {

    List<Long> dueForPublication(Instant now);

    /** False when the draft is no longer due: rescheduled, published by hand or deleted in the meantime. */
    boolean publishScheduled(Long id, Instant now);

    /**
     * What going public triggers (the newsletter). Called once the publication is committed,
     * so a failing mail server never unpublishes the content nor sends the same email twice.
     */
    default void announce(Long id) {
    }
}
