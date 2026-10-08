package com.brandonkamga.lescracks.cracklab.api.dto;

import com.brandonkamga.lescracks.cracklab.domain.ChallengeDifficulty;

import java.time.Instant;
import java.util.List;

public record ChallengeSummaryResponse(
        Long id,
        String slug,
        String title,
        String category,
        ChallengeDifficulty difficulty,
        List<String> tags,
        String expectedFormat,
        Integer maxWords,
        int totalPoints,
        long submissionCount,
        Instant publishedAt) {
}
