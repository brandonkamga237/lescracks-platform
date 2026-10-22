package com.brandonkamga.lescracks.recognition.application;

import com.brandonkamga.lescracks.recognition.domain.model.Badge;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateIssued;
import com.brandonkamga.lescracks.event.application.EventDirectory;
import com.brandonkamga.lescracks.event.domain.model.EventType;

/**
 * An issued attestation earns its badge: taking part in a hackathon or another event, a podium
 * place, a win. Runs in the issuing transaction, so an attestation and its badge go together.
 */
public class BadgeRules {
    private final BadgeService badges;
    private final EventDirectory events;

    public BadgeRules(BadgeService badges, EventDirectory events) {
        this.badges = badges;
        this.events = events;
    }

    public void onCertificateIssued(CertificateIssued issued) {
        String code = switch (issued.kind()) {
            case WINNER -> Badge.HACKATHON_WINNER;
            case PODIUM -> Badge.HACKATHON_PODIUM;
            case PARTICIPATION -> issued.eventId() != null && events.require(issued.eventId()).getType() == EventType.HACKATHON
                    ? Badge.HACKATHON_PARTICIPANT : Badge.EVENT_PARTICIPANT;
            case AMBASSADOR -> null;
        };
        if (code != null) badges.award(code, issued.userId(), null);
    }
}
