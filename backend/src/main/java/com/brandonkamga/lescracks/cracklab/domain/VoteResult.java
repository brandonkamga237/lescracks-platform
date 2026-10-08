package com.brandonkamga.lescracks.cracklab.domain;

/** The submission's new total and the voter's own vote after the change (0 when withdrawn). */
public record VoteResult(int voteScore, int myVote) {
}
