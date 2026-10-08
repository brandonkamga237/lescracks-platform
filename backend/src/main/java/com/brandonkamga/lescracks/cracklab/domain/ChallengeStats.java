package com.brandonkamga.lescracks.cracklab.domain;

/** Public figures of a challenge; `averageScore` and `bestScore` are null until a first grade. */
public record ChallengeStats(long participants, long graded, Integer averageScore, Integer bestScore) {
}
