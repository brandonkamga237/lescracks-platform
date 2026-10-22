package com.brandonkamga.lescracks.recognition.api.dto;

import com.brandonkamga.lescracks.recognition.application.BadgeHolder;

import java.time.Instant;

public record BadgeHolderResponse(Long userId, String name, String email, Instant awardedAt, String reason) {

    public static BadgeHolderResponse of(BadgeHolder holder) {
        var member = holder.member();
        String name = ((member.getFirstName() == null ? "" : member.getFirstName()) + " " + (member.getLastName() == null ? "" : member.getLastName())).trim();
        return new BadgeHolderResponse(member.getId(), name.isEmpty() ? member.getEmail() : name, member.getEmail(),
                holder.award().getAwardedAt(), holder.award().getReason());
    }
}
