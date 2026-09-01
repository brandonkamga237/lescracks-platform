package com.brandonkamga.lescracks.dto.event;

import com.brandonkamga.lescracks.domain.EventKind;
import com.brandonkamga.lescracks.dto.media.MediaResponse;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/** Everything about one event, for its own page. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record EventDetail(
        Long id,
        String slug,
        EventKind kind,
        String title,
        String summary,
        String description,
        Instant startsAt,
        Instant endsAt,
        String location,
        Integer capacity,
        MediaResponse cover,
        EventPhase phase,
        boolean published,
        /** Whether applications are still worth offering: published, and not over. */
        boolean acceptingApplications) {
}
