package com.brandonkamga.lescracks.engagement.application;

import com.brandonkamga.lescracks.engagement.domain.model.TargetType;

import java.util.Collection;
import java.util.Map;

/**
 * Implemented by each module whose content people react to, so engagement never depends on
 * them: one implementation per {@link TargetType}, picked by the registry.
 */
public interface ContentTargets {

    TargetType type();

    /** Published, so it may be viewed, liked and commented on. */
    boolean isOpen(Long id);

    /** Pages of several targets in one query; unknown ids are absent. */
    Map<Long, TargetPage> describe(Collection<Long> ids);
}
