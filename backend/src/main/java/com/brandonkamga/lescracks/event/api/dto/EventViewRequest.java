package com.brandonkamga.lescracks.event.api.dto;

import com.brandonkamga.lescracks.event.domain.EventVisitor;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import java.util.UUID;

/** The random id an anonymous browser keeps; a signed-in member is recognised by the session instead. */
public record EventViewRequest(UUID visitorId) {

    public EventVisitor toVisitor(String memberEmail) {
        if (memberEmail != null) return EventVisitor.member(memberEmail);
        if (visitorId == null) throw new BadRequestException("Identifiant de visiteur manquant.");
        return EventVisitor.anonymous(visitorId);
    }
}
