package com.brandonkamga.lescracks.domain;

/**
 * The stages an application actually goes through.
 *
 * The previous model was {@code pending / accepted / rejected} — a three-faced
 * boolean. It could say how many candidates were accepted, but never *where* the
 * others were lost: an application nobody had read looked identical to one that was
 * interviewed and declined, and someone accepted who never showed up was
 * indistinguishable from someone who finished the whole programme.
 *
 * These stages make the drop-off visible, which is the entire point of a funnel.
 */
public enum ApplicationStatus {

    /** It arrived. Nobody has looked at it yet. */
    RECEIVED,

    /** Someone is reading it. */
    UNDER_REVIEW,

    /** An interview has been scheduled or held. */
    INTERVIEW,

    /** Offered a place in the programme. */
    ACCEPTED,

    /** Accepted AND actually started — the two are not the same thing. */
    STARTED,

    /** Finished the accompaniment. */
    COMPLETED,

    /** Declined, at any stage. */
    REJECTED;

    /** True while the candidate is still live in the funnel. */
    public boolean isOpen() {
        return this == RECEIVED || this == UNDER_REVIEW || this == INTERVIEW;
    }
}
