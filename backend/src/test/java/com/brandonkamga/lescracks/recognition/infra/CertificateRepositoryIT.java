package com.brandonkamga.lescracks.recognition.infra;

import com.brandonkamga.lescracks.event.domain.Event;
import com.brandonkamga.lescracks.event.domain.EventFormat;
import com.brandonkamga.lescracks.event.domain.EventStatus;
import com.brandonkamga.lescracks.event.domain.EventType;
import com.brandonkamga.lescracks.event.infra.EventRepository;
import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.recognition.domain.Certificate;
import com.brandonkamga.lescracks.recognition.domain.CertificateCodes;
import com.brandonkamga.lescracks.recognition.domain.CertificateKind;
import com.brandonkamga.lescracks.recognition.domain.CertificateStatus;
import com.brandonkamga.lescracks.support.PostgresIT;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Attestations against real PostgreSQL: one of a kind per person and event, codes unique. */
@Transactional
class CertificateRepositoryIT extends PostgresIT {

    @Autowired private CertificateRepository certificates;
    @Autowired private EventRepository events;
    @Autowired private UserRepository users;

    private User awa;
    private Event hackathon;

    @BeforeEach
    void seed() {
        awa = users.saveAndFlush(User.builder().email("awa.cert@example.com").firstName("Awa").lastName("D").passwordHash("h").build());
        hackathon = events.saveAndFlush(Event.builder().title("Hackathon cert").slug("hackathon-cert").description("D")
                .type(EventType.HACKATHON).format(EventFormat.ONLINE).status(EventStatus.PUBLISHED).startDate(Instant.now()).build());
    }

    private Certificate certificate(CertificateKind kind, String code) {
        return Certificate.builder().code(code).userId(awa.getId()).eventId(hackathon.getId()).kind(kind)
                .holderName("Awa D").title("a participé").build();
    }

    @Test
    @DisplayName("one attestation of a kind per person and event")
    void oneOfAKind() {
        certificates.saveAndFlush(certificate(CertificateKind.PARTICIPATION, CertificateCodes.next()));

        assertThat(certificates.existsByUserIdAndEventIdAndKind(awa.getId(), hackathon.getId(), CertificateKind.PARTICIPATION)).isTrue();
        assertThat(certificates.existsByUserIdAndEventIdAndKind(awa.getId(), hackathon.getId(), CertificateKind.WINNER)).isFalse();
        assertThatThrownBy(() -> certificates.saveAndFlush(certificate(CertificateKind.PARTICIPATION, CertificateCodes.next())))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("a code is found back, cannot be reused, and an issued attestation is listed for its holder")
    void codes() {
        Certificate issued = certificate(CertificateKind.WINNER, CertificateCodes.next());
        issued.setStatus(CertificateStatus.ISSUED);
        issued.setIssuedAt(Instant.now());
        certificates.saveAndFlush(issued);

        assertThat(certificates.findByCode(issued.getCode())).isPresent();
        assertThat(certificates.findByUserIdAndStatusOrderByIssuedAtDesc(awa.getId(), CertificateStatus.ISSUED)).hasSize(1);
        assertThatThrownBy(() -> certificates.saveAndFlush(certificate(CertificateKind.PODIUM, issued.getCode())))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
