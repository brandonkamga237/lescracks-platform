package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.Application;
import com.brandonkamga.lescracks.domain.ApplicationStatus;
import com.brandonkamga.lescracks.domain.EnrolmentTarget;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Requests to join: the Accompagnement 360 when it is open, or a particular event.
 *
 * Applying needs no account. People apply first and register afterwards, and demanding a
 * sign-up before the form loses exactly the people who would have filled it.
 */
public interface ApplicationService {

    /** Refuses when the 360 is closed, or the event is not taking anyone. */
    Application apply(ApplicationDraft draft);

    Page<Application> byStatus(ApplicationStatus status, Pageable pageable);

    Page<Application> byTarget(EnrolmentTarget target, Pageable pageable);

    Application require(Long id);

    /** Accepting is what {@code ParticipationService} turns into a participation. */
    Application decide(Long id, ApplicationStatus outcome);

    record ApplicationDraft(
            EnrolmentTarget target,
            Long eventId,
            String fullName,
            String email,
            String phone,
            String motivation) {
    }
}
