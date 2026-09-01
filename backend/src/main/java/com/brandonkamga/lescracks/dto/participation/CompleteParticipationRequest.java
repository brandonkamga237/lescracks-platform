package com.brandonkamga.lescracks.dto.participation;

import java.time.LocalDate;

/**
 * Confirming somebody finished.
 *
 * The date is optional and defaults to today, because an admin validating on the day should
 * not have to type what the server already knows.
 */
public record CompleteParticipationRequest(LocalDate completedOn) {
}
