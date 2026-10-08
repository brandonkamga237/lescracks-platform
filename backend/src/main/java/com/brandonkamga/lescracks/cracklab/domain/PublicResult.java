package com.brandonkamga.lescracks.cracklab.domain;

/**
 * A graded answer as it can be shared: the score and where it stands, never the answer itself.
 * `betterThanPercent` compares it to the other graded answers to the same challenge.
 */
public record PublicResult(Submission submission, Level authorLevel, int rankOnChallenge, int betterThanPercent, ChallengeStats stats) {
}
