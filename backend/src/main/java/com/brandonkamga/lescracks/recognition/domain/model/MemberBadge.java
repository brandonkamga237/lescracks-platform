package com.brandonkamga.lescracks.recognition.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** A badge held by a member, with why and since when. */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class MemberBadge {
    private Long id;
    private Badge badge;
    private Long userId;
    private String reason;

    @Builder.Default
    private Instant awardedAt = Instant.now();
}
