package com.brandonkamga.lescracks.cracklab.api.dto;

import com.brandonkamga.lescracks.cracklab.domain.SubmissionStatus;

import java.time.Instant;

/** A shared result: who, which challenge, the score and how it compares. The answer stays private. */
public record PublicResultResponse(
        Long submissionId,
        ChallengeSummaryResponse challenge,
        AuthorResponse author,
        LevelResponse authorLevel,
        SubmissionStatus status,
        Integer score,
        int totalPoints,
        int rankOnChallenge,
        int betterThanPercent,
        Instant gradedAt) {
}
