package com.brandonkamga.lescracks.engagement.domain.port;

import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;

import java.util.Collection;
import java.util.Map;

/** Views and likes, and the counters kept beside them so a list reads its figures in one query. */
public interface ReactionStore {

    /** Counts the visitor once per target; true when this was their first view. */
    boolean addView(Target target, String visitorKey);

    /** True when the like is new. */
    boolean addLike(Target target, Long accountId);

    /** True when there was a like to remove. */
    boolean removeLike(Target target, Long accountId);

    boolean hasLiked(Target target, Long accountId);

    Counts counts(Target target);

    /** One query whatever the number of ids; targets nobody reacted to are absent. */
    Map<Long, Counts> counts(TargetType type, Collection<Long> ids);

    /** The most liked targets of a type, most liked first; in order, at most {@code limit}. */
    Map<Long, Counts> mostLiked(TargetType type, int limit);

    /** Drops the views, likes and counters of a target that no longer exists. */
    void forget(Target target);

    /** Takes the member's likes off each target's like count, in one statement. */
    void releaseLikesOf(Long accountId);
}
