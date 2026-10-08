package com.brandonkamga.lescracks.cracklab.api.dto;

import com.brandonkamga.lescracks.cracklab.domain.ChallengeDifficulty;

import java.time.Instant;
import java.util.List;

/** `referenceSolution` is null until the viewer has submitted their own answer. */
public record ChallengeDetailResponse(
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
        int totalPoints,
        List<CriterionResponse> criteria,
        long submissionCount,
        Instant publishedAt,
        String referenceSolution,
        SubmissionResponse mySubmission) {
}
