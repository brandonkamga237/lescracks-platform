package com.brandonkamga.lescracks.event.application;

/** The organisers writing to everyone still registered for an event, for instance after a change. */
public interface RegistrantMessages {

    /** Emails the message to each active registrant; returns how many emails were sent. */
    int write(Long eventId, String message);
}
