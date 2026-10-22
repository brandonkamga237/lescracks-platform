package com.brandonkamga.lescracks.event.domain;

import com.brandonkamga.lescracks.shared.util.VisitorKeys;

import java.util.UUID;

/** Someone opening an event page, reduced to a stable key: the same person counts once. */
public record EventVisitor(String key) {

    public static EventVisitor member(String email) {
        return new EventVisitor(VisitorKeys.member(email));
    }

    public static EventVisitor anonymous(UUID browserId) {
        return new EventVisitor(VisitorKeys.anonymous(browserId));
    }
}
