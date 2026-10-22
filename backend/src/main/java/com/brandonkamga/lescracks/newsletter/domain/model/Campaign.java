package com.brandonkamga.lescracks.newsletter.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** A newsletter issue as it was sent: what, and to how many. */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class Campaign {

    private Long id;

    private String subject;

    private String message;

    private int recipientCount;

    @Builder.Default
    private Instant sentAt = Instant.now();
}
