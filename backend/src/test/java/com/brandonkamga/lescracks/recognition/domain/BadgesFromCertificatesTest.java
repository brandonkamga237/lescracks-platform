package com.brandonkamga.lescracks.recognition.domain;

import com.brandonkamga.lescracks.event.domain.Event;
import com.brandonkamga.lescracks.event.domain.EventService;
import com.brandonkamga.lescracks.event.domain.EventType;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BadgesFromCertificatesTest {

    private final BadgeService badges = mock(BadgeService.class);
    private final EventService events = mock(EventService.class);
    private final BadgesFromCertificates rule = new BadgesFromCertificates(badges, events);

    @Test
    @DisplayName("each attestation earns its badge: hackathon or event participation, podium, win")
    void mapsAttestationsToBadges() {
        when(events.require(1L)).thenReturn(Event.builder().id(1L).type(EventType.HACKATHON).build());
        when(events.require(2L)).thenReturn(Event.builder().id(2L).type(EventType.WORKSHOP).build());

        rule.on(new CertificateIssued(7L, CertificateKind.PARTICIPATION, 1L));
        rule.on(new CertificateIssued(7L, CertificateKind.PARTICIPATION, 2L));
        rule.on(new CertificateIssued(7L, CertificateKind.PODIUM, 1L));
        rule.on(new CertificateIssued(7L, CertificateKind.WINNER, 1L));

        verify(badges).award(Badge.HACKATHON_PARTICIPANT, 7L, null);
        verify(badges).award(Badge.EVENT_PARTICIPANT, 7L, null);
        verify(badges).award(Badge.HACKATHON_PODIUM, 7L, null);
        verify(badges).award(Badge.HACKATHON_WINNER, 7L, null);
    }

    @Test
    @DisplayName("an ambassador attestation has no badge of its own yet")
    void ambassadorEarnsNothingHere() {
        rule.on(new CertificateIssued(7L, CertificateKind.AMBASSADOR, null));
        verify(badges, never()).award(any(), any(), any());
    }
}
