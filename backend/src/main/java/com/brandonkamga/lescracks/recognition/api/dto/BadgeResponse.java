package com.brandonkamga.lescracks.recognition.api.dto;

import com.brandonkamga.lescracks.recognition.domain.model.Badge;

/** A catalogue entry with how many members hold it. */
public record BadgeResponse(Long id, String code, String name, String description, String icon, boolean system, long holders) {

    public static BadgeResponse of(Badge badge, long holders) {
        return new BadgeResponse(badge.getId(), badge.getCode(), badge.getName(), badge.getDescription(), badge.getIcon(),
                badge.isSystem(), holders);
    }
}
