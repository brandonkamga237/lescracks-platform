package com.brandonkamga.lescracks.recognition.application;

import com.brandonkamga.lescracks.event.application.EventDirectory;
import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventType;
import com.brandonkamga.lescracks.recognition.domain.model.Badge;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateIssued;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateKind;
import com.brandonkamga.lescracks.recognition.domain.model.MemberBadge;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BadgeRulesTest {

    private final InMemoryRecognition.Badges badges = new InMemoryRecognition.Badges();
    private final InMemoryRecognition.Awards awards = new InMemoryRecognition.Awards();
    private final EventDirectory events = mock(EventDirectory.class);
    private final BadgeRules rules = new BadgeRules(new BadgeServiceImpl(badges, awards, null, null, null), events);

    @BeforeEach
    void setUp() {
        badges.awards = awards;
        for (String code : new String[] {Badge.EVENT_PARTICIPANT, Badge.HACKATHON_PARTICIPANT, Badge.HACKATHON_PODIUM, Badge.HACKATHON_WINNER}) {
            badges.save(Badge.builder().code(code).name(code).description("d").system(true).build());
        }
        when(events.require(1L)).thenReturn(Event.builder().id(1L).type(EventType.HACKATHON).build());
        when(events.require(2L)).thenReturn(Event.builder().id(2L).type(EventType.WORKSHOP).build());
    }

    @Test
    @DisplayName("each attestation earns its badge: hackathon or event participation, podium, win; ambassador none yet")
    void mapsAttestationsToBadges() {
        rules.onCertificateIssued(new CertificateIssued(7L, CertificateKind.PARTICIPATION, 1L));
        rules.onCertificateIssued(new CertificateIssued(7L, CertificateKind.PARTICIPATION, 2L));
        rules.onCertificateIssued(new CertificateIssued(7L, CertificateKind.PODIUM, 1L));
        rules.onCertificateIssued(new CertificateIssued(7L, CertificateKind.WINNER, 1L));
        rules.onCertificateIssued(new CertificateIssued(7L, CertificateKind.AMBASSADOR, null));

        assertThat(awards.findByUser(7L)).extracting(MemberBadge::getBadge).extracting(Badge::getCode).containsExactlyInAnyOrder(
                Badge.HACKATHON_PARTICIPANT, Badge.EVENT_PARTICIPANT, Badge.HACKATHON_PODIUM, Badge.HACKATHON_WINNER);
    }
}
