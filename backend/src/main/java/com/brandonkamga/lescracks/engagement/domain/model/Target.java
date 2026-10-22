package com.brandonkamga.lescracks.engagement.domain.model;

import java.util.Objects;

/** One piece of content people react to. */
public record Target(TargetType type, Long id) {

    public Target {
        Objects.requireNonNull(type, "type");
        Objects.requireNonNull(id, "id");
    }

    public static Target article(Long id) {
        return new Target(TargetType.ARTICLE, id);
    }

    public static Target event(Long id) {
        return new Target(TargetType.EVENT, id);
    }
}
