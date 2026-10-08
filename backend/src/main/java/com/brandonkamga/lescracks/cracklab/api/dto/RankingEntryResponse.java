package com.brandonkamga.lescracks.cracklab.api.dto;

public record RankingEntryResponse(int rank, AuthorResponse member, long totalScore, long challenges, boolean me) {
}
