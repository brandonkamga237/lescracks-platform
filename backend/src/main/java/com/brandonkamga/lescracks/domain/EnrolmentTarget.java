package com.brandonkamga.lescracks.domain;

/**
 * What an application or a participation is aimed at.
 *
 * Stated on the row rather than inferred from a missing foreign key: an absence should mean
 * "not set", never "the other case".
 */
public enum EnrolmentTarget {
    /** The Accompagnement 360, which is one permanent thing rather than a scheduled date. */
    MENTORSHIP,
    /** A specific bootcamp or workshop. */
    EVENT,
}
