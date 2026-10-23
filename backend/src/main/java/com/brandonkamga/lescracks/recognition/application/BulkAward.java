package com.brandonkamga.lescracks.recognition.application;

import java.util.List;

/** What a grant did: who got the badge now, who already held it, and the addresses nobody uses. */
public record BulkAward(int awarded, int alreadyHeld, List<String> unknownEmails) {
}
