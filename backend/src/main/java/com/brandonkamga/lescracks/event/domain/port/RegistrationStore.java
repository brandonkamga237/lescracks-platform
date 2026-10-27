package com.brandonkamga.lescracks.event.domain.port;

import com.brandonkamga.lescracks.event.domain.model.Registration;

import java.util.List;
import java.util.Optional;

public interface RegistrationStore {

    Optional<Registration> findById(Long id);

    Optional<Registration> find(Long eventId, Long userId);

    /** Oldest first, cancelled ones included. */
    List<Registration> findByEvent(Long eventId);

    /** Not cancelled, the latest event first. */
    List<Registration> findActiveByMember(Long userId);

    Registration save(Registration registration);

    /** Moves the event's registration_count atomically, so two members signing up at once both count. */
    void shiftCount(Long eventId, int delta);

    /** Takes the member's active registrations off their events' counts, in one statement. */
    void releaseCountsOf(Long userId);
}
