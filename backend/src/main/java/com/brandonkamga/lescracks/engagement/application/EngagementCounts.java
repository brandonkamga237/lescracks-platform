package com.brandonkamga.lescracks.engagement.application;

import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;

import java.util.Collection;
import java.util.Map;

/** What content modules read and tell: the figures their cards show, and that a target is gone. */
public interface EngagementCounts {

    Counts countsOf(Target target);

    /** One query whatever the number of ids; a target nobody reacted to reads as {@link Counts#NONE}. */
    Map<Long, Counts> countsOf(TargetType type, Collection<Long> ids);

    /** Drops every view, like and comment of a deleted target. */
    void forget(Target target);
}
