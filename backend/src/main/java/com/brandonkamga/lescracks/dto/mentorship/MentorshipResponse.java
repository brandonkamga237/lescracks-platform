package com.brandonkamga.lescracks.dto.mentorship;

import com.brandonkamga.lescracks.dto.media.MediaResponse;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * The Accompagnement 360.
 *
 * {@code open} is what a page branches on: it decides whether the apply button exists at all,
 * rather than letting someone submit a form that will be refused.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record MentorshipResponse(
        boolean open,
        String title,
        String summary,
        String description,
        MediaResponse cover) {
}
