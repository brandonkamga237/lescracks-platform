package com.brandonkamga.lescracks.domain;

public enum ParticipationStatus {
    /** Accepted and under way. */
    IN_PROGRESS,
    /** An admin confirmed the person went through with it. Only this state earns an attestation. */
    COMPLETED,
    /** Started and stopped. Kept rather than deleted: it is part of an honest count. */
    ABANDONED,
}
