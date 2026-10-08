package com.brandonkamga.lescracks.cracklab.api.dto;

import com.brandonkamga.lescracks.cracklab.domain.SubmissionStatus;

import java.time.Instant;
import java.util.List;

public record SubmissionResponse(
        Long id,
        Long challengeId,
        String challengeSlug,
        String challengeTitle,
        AuthorResponse author,
        String answer,
        int wordCount,
        Integer technicalScore,
        int totalPoints,
        int voteScore,
        int myVote,
        boolean mine,
        SubmissionStatus status,
        Instant createdAt,
        Instant gradedAt,
        List<EvaluationResponse> evaluations) {
}
