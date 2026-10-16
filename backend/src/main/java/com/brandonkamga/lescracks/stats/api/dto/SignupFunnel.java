package com.brandonkamga.lescracks.stats.api.dto;

/**
 * What became of the members who signed up over the last 30 days: where the counts drop is where
 * people get lost (unconfirmed address, skipped welcome, never came back).
 */
public record SignupFunnel(long signedUp, long verified, long onboarded, long returned) {
}
