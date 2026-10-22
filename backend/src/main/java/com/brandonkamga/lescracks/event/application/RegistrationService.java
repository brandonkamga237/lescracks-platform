package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.Registration;
import com.brandonkamga.lescracks.event.domain.model.RegistrationStatus;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/** Members signing up for events, and the admin taking attendance afterwards. */
public interface RegistrationService {

    /** Signs the member up; signing up twice keeps one registration. */
    Registration register(Long eventId, String email);

    void cancel(Long eventId, String email);

    /** The member's registration, unless cancelled. */
    Optional<Registration> find(Long eventId, String email);

    /** The member's current and past events, latest first; cancelled ones are left out. */
    List<MyEvent> listMine(String email);

    /** Oldest first, cancelled ones included. */
    List<RegistrationView> listForEvent(Long eventId);

    /** After the event: ATTENDED or ABSENT. */
    Registration markAttendance(Long registrationId, RegistrationStatus status);

    /** Signs members up without the "event still ahead" check: the people named on a project. */
    void ensureRegistered(Long eventId, Collection<Long> userIds);
}
