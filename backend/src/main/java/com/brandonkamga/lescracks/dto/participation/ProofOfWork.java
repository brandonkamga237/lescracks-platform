package com.brandonkamga.lescracks.dto.participation;

import java.util.Map;

/**
 * How many people the platform has actually helped.
 *
 * {@code peopleHelped} counts each person once however much they followed, so it cannot be
 * inflated by someone doing three things. {@code inProgress} is published beside it on
 * purpose: a completion figure with no denominator is a number nobody can read.
 */
public record ProofOfWork(
        long peopleHelped,
        long completed,
        long inProgress,
        Map<String, Long> byProgramme) {
}
