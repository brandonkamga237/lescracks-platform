package com.brandonkamga.lescracks.dto.participation;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.time.LocalDate;

/**
 * What a public check answers with.
 *
 * Deliberately thin: the name, what was followed, when it ended, and the code. No email, no
 * identifier, nothing that turns a verification link into a way of harvesting people —
 * whoever holds a code can already read this, so it must be safe for them to.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AttestationResponse(
        String code,
        String holderName,
        String programme,
        LocalDate completedAt,
        Instant issuedAt) {
}
