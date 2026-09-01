package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.Mentorship;

/**
 * The Accompagnement 360, which is one thing that is either open to applications or not.
 *
 * Callers ask this rather than the repository so nobody has to know the row's id, and so the
 * single-row rule is stated once.
 */
public interface MentorshipService {

    Mentorship current();

    /** Opening it is what lets applications through; closing it is how they stop. */
    Mentorship setOpen(boolean open);

    Mentorship update(String title, String summary, String description, Long coverId);

    /** Whether an application may be filed right now. */
    boolean isOpen();
}
