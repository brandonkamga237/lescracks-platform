package com.brandonkamga.lescracks.cracklab.api.dto;

import com.brandonkamga.lescracks.cracklab.domain.ChallengeDifficulty;
import com.brandonkamga.lescracks.cracklab.domain.SubmissionStatus;

import java.time.Instant;
import java.util.List;

/** A member's progress, for their own dashboard and for their public profile (never any answer text). */
public record ProgressResponse(
        AuthorResponse member,
        long xp,
        LevelResponse level,
        LevelResponse nextLevel,
        int rank,
        int rankedMembers,
        int betterThanPercent,
        long pointsToNextRank,
        long weekScore,
        int answered,
        int graded,
        int averagePercent,
        int bestPercent,
        int streak,
        boolean activeThisWeek,
        int bestStreak,
        List<BadgeResponse> badges,
        List<HistoryItem> history,
        boolean me) {

    public record BadgeResponse(String code, String label, String description, boolean unlocked) {
    }

    public record HistoryItem(Long submissionId, String challengeSlug, String challengeTitle, String category,
                              ChallengeDifficulty difficulty, SubmissionStatus status, Integer score, int totalPoints, Instant createdAt) {
    }
}
