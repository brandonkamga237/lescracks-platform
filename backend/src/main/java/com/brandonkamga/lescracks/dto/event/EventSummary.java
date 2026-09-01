package com.brandonkamga.lescracks.dto.event;

import com.brandonkamga.lescracks.domain.EventKind;
import com.brandonkamga.lescracks.dto.media.MediaResponse;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * An event as it appears in a list.
 *
 * {@code phase} is computed from the dates rather than stored, so a card can say "terminé"
 * without every client reimplementing the comparison — and without a stored status that
 * disagrees with the date beside it.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record EventSummary(
        Long id,
        String slug,
        EventKind kind,
        String title,
        String summary,
        Instant startsAt,
        Instant endsAt,
        String location,
        MediaResponse cover,
        EventPhase phase,
        boolean published) {
}
