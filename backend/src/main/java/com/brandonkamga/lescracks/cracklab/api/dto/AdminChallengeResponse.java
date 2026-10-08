package com.brandonkamga.lescracks.cracklab.api.dto;

import com.brandonkamga.lescracks.cracklab.domain.ChallengeDifficulty;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeStatus;

import java.time.Instant;
import java.util.List;

/** `gradingLocked`: a submission is graded, so the rubric's points and criteria can no longer change. */
public record AdminChallengeResponse(
        Long id,
        String slug,
        String title,
        String category,
        ChallengeDifficulty difficulty,
        List<String> tags,
        String problem,
        String constraints,
        String expectedFormat,
        Integer maxWords,
        String referenceSolution,
        List<CriterionResponse> criteria,
        int totalPoints,
        ChallengeStatus status,
        String createdBy,
        long submissionCount,
        long pendingCount,
        boolean gradingLocked,
        Instant publishedAt,
        Instant createdAt,
        Instant updatedAt,
        Instant scheduledAt) {
}
