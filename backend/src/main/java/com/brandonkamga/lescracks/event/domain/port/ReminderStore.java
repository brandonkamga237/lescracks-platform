package com.brandonkamga.lescracks.event.domain.port;

import com.brandonkamga.lescracks.event.domain.model.DueReminder;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface ReminderStore {

    /**
     * Reminders not sent yet whose moment has come at {@code now}, for members still signed up
     * to a published rendez-vous: the day-before one from 24 h to 1 h before the start, then the
     * hour-before one until the start. Hackathons are not rendez-vous and get none.
     */
    List<DueReminder> findDue(Instant now);

    /** Marks these reminders as sent, in one statement; one already marked stays as it was. */
    void markSent(Collection<DueReminder> reminders, Instant at);
}
