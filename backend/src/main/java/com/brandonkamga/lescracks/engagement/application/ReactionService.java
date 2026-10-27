package com.brandonkamga.lescracks.engagement.application;

import com.brandonkamga.lescracks.engagement.domain.model.Target;

/** Views and likes, as readers send them. */
public interface ReactionService {

    /** Counts the visitor once per target; returns the target's figure afterwards. */
    int recordView(Target target, String visitorKey);

    /** {@code email} may be null for a visitor, who has not liked anything. */
    LikeStatus viewLikes(Target target, String email);

    LikeStatus like(Target target, String email);

    LikeStatus unlike(Target target, String email);

    /** The member's account is about to go: their likes stop counting. */
    void forgetMember(Long accountId);
}
