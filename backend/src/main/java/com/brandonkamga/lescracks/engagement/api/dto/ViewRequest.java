package com.brandonkamga.lescracks.engagement.api.dto;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.util.VisitorKeys;

import java.util.UUID;

/** The random id an anonymous browser keeps; a signed-in member is recognised by the session instead. */
public record ViewRequest(UUID visitorId) {

    public String toVisitorKey(String memberEmail) {
        if (memberEmail != null) return VisitorKeys.member(memberEmail);
        if (visitorId == null) throw new BadRequestException("Identifiant de visiteur manquant.");
        return VisitorKeys.anonymous(visitorId);
    }
}
