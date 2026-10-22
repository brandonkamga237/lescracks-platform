package com.brandonkamga.lescracks.engagement.application;

import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import java.util.Collection;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/** Finds the module behind a target type. */
public class TargetRegistry {

    private final Map<TargetType, ContentTargets> byType = new EnumMap<>(TargetType.class);

    public TargetRegistry(List<ContentTargets> targets) {
        targets.forEach(target -> {
            if (byType.put(target.type(), target) != null) {
                throw new IllegalStateException("Two modules claim " + target.type());
            }
        });
    }

    /** A target that exists and is published; anything else answers as not found. */
    public void requireOpen(Target target) {
        ContentTargets targets = byType.get(target.type());
        if (targets == null || !targets.isOpen(target.id())) {
            throw new NotFoundException("Contenu", "id", target.id());
        }
    }

    public Map<Long, TargetPage> describe(TargetType type, Collection<Long> ids) {
        ContentTargets targets = byType.get(type);
        return targets == null || ids.isEmpty() ? Map.of() : targets.describe(ids);
    }
}
