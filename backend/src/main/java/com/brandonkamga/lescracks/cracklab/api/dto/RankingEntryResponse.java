package com.brandonkamga.lescracks.cracklab.api.dto;

/** `totalScore` is the all-time XP on the global board and this week's points on the weekly one. */
public record RankingEntryResponse(int rank, AuthorResponse member, long totalScore, long challenges, boolean me, LevelResponse level) {
}
