package com.brandonkamga.lescracks.dto.participation;

import com.brandonkamga.lescracks.domain.EnrolmentTarget;
import com.brandonkamga.lescracks.domain.ParticipationStatus;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;

/**
 * What somebody followed, and where it got to.
 *
 * {@code programme} is the label rather than an id, because the two cases resolve differently
 * — an event's title, or the Accompagnement 360 — and every client would otherwise write that
 * branch again.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ParticipationResponse(
        Long id,
        EnrolmentTarget target,
        Long eventId,
        String programme,
        ParticipationStatus status,
        String cohort,
        LocalDate startedAt,
        LocalDate completedAt,
        /** The person, for the back office. Omitted when someone reads their own. */
        Long userId,
        String userName,
        String attestationCode) {
}
