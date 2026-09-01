package com.brandonkamga.lescracks.dto.user;

import com.brandonkamga.lescracks.dto.media.MediaResponse;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/** Who someone is. The Keycloak subject stays server-side; it is an internal join key. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserResponse(
        Long id,
        String email,
        String displayName,
        MediaResponse avatar,
        Instant createdAt) {
}
