package com.brandonkamga.lescracks.event.domain;

import java.util.List;
import java.util.Optional;

/** Members signing up for events, and the admin taking attendance afterwards. */
public interface EventRegistrationService {

    /** Signs the member up; signing up twice keeps one registration. */
    EventRegistration register(Long eventId, String email);

    void cancel(Long eventId, String email);

    Optional<EventRegistration> find(Long eventId, String email);

    /** The member's current and past events, newest first; cancelled ones are left out. */
    List<EventRegistration> mine(String email);

    List<RegistrationView> forEvent(Long eventId);

    /** After the event: ATTENDED or ABSENT. */
    EventRegistration markAttendance(Long registrationId, RegistrationStatus status);

    /** Signs a member up without the "event still ahead" check: a teammate named on a project. */
    void ensureRegistered(Event event, Long userId);
}
