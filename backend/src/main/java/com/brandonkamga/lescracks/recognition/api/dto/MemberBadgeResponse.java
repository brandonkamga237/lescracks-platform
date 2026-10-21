package com.brandonkamga.lescracks.recognition.api.dto;

import com.brandonkamga.lescracks.recognition.domain.MemberBadge;

import java.time.Instant;

/** A badge as a profile shows it. */
public record MemberBadgeResponse(String code, String name, String description, String icon, Instant awardedAt, String reason) {

    public static MemberBadgeResponse of(MemberBadge award) {
        var badge = award.getBadge();
        return new MemberBadgeResponse(badge.getCode(), badge.getName(), badge.getDescription(), badge.getIcon(),
                award.getAwardedAt(), award.getReason());
    }
}
