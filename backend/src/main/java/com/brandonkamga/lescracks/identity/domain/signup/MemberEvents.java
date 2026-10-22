package com.brandonkamga.lescracks.identity.domain.signup;

/** What identity tells the rest of the platform; who listens is not its concern. */
public interface MemberEvents {

    /** Delivered inside the sign-up transaction, so listeners see the new member. */
    void registered(MemberRegistered event);
}
