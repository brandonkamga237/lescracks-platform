package com.brandonkamga.lescracks.recognition.infra.persistence;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventFormat;
import com.brandonkamga.lescracks.event.domain.model.EventStatus;
import com.brandonkamga.lescracks.event.domain.model.EventType;
import com.brandonkamga.lescracks.event.domain.port.EventStore;
import com.brandonkamga.lescracks.recognition.domain.model.Badge;
import com.brandonkamga.lescracks.recognition.domain.model.Certificate;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateCodes;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateKind;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateStatus;
import com.brandonkamga.lescracks.recognition.domain.model.MemberBadge;
import com.brandonkamga.lescracks.recognition.domain.port.AwardStore;
import com.brandonkamga.lescracks.recognition.domain.port.BadgeStore;
import com.brandonkamga.lescracks.recognition.domain.port.CertificateStore;
import com.brandonkamga.lescracks.support.PostgresIT;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Every statement of recognition's adapters against PostgreSQL. */
@Transactional
class JdbcRecognitionIT extends PostgresIT {

    @Autowired private BadgeStore badges;
    @Autowired private AwardStore awards;
    @Autowired private CertificateStore certificates;
    @Autowired private AccountStore accounts;
    @Autowired private EventStore events;

    private Long awa;
    private Long kofi;
    private Event hackathon;

    @BeforeEach
    void setUp() {
        awa = accounts.save(Account.builder().email("awa.reco@example.com").firstName("Awa").lastName("D").passwordHash("h").build()).getId();
        kofi = accounts.save(Account.builder().email("kofi.reco@example.com").firstName("Kofi").lastName("A").passwordHash("h").build()).getId();
        hackathon = events.save(Event.builder().slug("it-reco-hackathon").title("Hackathon").description("D").type(EventType.HACKATHON)
                .format(EventFormat.ONLINE).status(EventStatus.PUBLISHED).startDate(Instant.now()).build());
    }

    private Certificate draft(Long userId, CertificateKind kind, String detail) {
        return Certificate.builder().code(CertificateCodes.next()).userId(userId).eventId(hackathon.getId()).kind(kind)
                .holderName("Nom").title("a participé").detail(detail).eventDate(Instant.parse("2026-11-01T09:30:00.123456Z")).build();
    }

    @Test
    @DisplayName("the migration seeds the system badges the rules award, system ones first in the catalogue")
    void seedsSystemBadges() {
        for (String code : new String[]{Badge.EVENT_PARTICIPANT, Badge.HACKATHON_PARTICIPANT, Badge.HACKATHON_PODIUM, Badge.HACKATHON_WINNER}) {
            assertThat(badges.findByCode(code)).as(code).hasValueSatisfying(badge -> assertThat(badge.isSystem()).isTrue());
        }
        assertThat(badges.findAll().get(0).isSystem()).isTrue();
    }

    @Test
    @DisplayName("a member holds a badge once, read with its badge, and the catalogue counts holders")
    void badgesAndAwards() {
        Badge custom = badges.save(Badge.builder().code("CUSTOM_IT").name("IT").description("d").icon("star").build());
        custom.edit("IT renommé", "d2", "heart");
        badges.save(custom);
        assertThat(badges.findById(custom.getId())).get().extracting(Badge::getName, Badge::getIcon).containsExactly("IT renommé", "heart");

        MemberBadge first = awards.add(MemberBadge.builder().badge(custom).userId(awa).reason("premier").build());
        MemberBadge second = awards.add(MemberBadge.builder().badge(custom).userId(awa).reason("second").build());
        awards.add(MemberBadge.builder().badge(custom).userId(kofi).build());

        assertThat(second.getId()).isEqualTo(first.getId());
        assertThat(second.getReason()).isEqualTo("premier");
        assertThat(awards.findByUser(awa)).extracting(award -> award.getBadge().getCode()).contains("CUSTOM_IT");
        assertThat(badges.countHolders()).containsEntry(custom.getId(), 2L);
        awards.delete(custom.getId(), kofi);
        assertThat(awards.findByBadge(custom.getId())).hasSize(1);

        assertThat(awards.addAll(custom, List.of(awa, kofi), "en masse")).containsExactly(kofi);
        assertThat(awards.find(custom.getId(), kofi)).get().extracting(MemberBadge::getReason).isEqualTo("en masse");
        assertThat(awards.addAll(custom, List.of(), null)).isEmpty();
    }

    @Test
    @DisplayName("drafts go in at once and skip a kind the member already has; issuing many is one statement")
    void certificates() {
        int added = certificates.addDrafts(List.of(draft(awa, CertificateKind.PARTICIPATION, "Projet"),
                draft(awa, CertificateKind.WINNER, null), draft(kofi, CertificateKind.PARTICIPATION, null)));
        int again = certificates.addDrafts(List.of(draft(awa, CertificateKind.PARTICIPATION, "Projet"), draft(kofi, CertificateKind.PODIUM, null)));

        assertThat(added).isEqualTo(3);
        assertThat(again).isEqualTo(1);
        List<Certificate> listed = certificates.findByEvent(hackathon.getId());
        assertThat(listed).hasSize(4).allSatisfy(c -> assertThat(c.getEventDate()).isEqualTo(Instant.parse("2026-11-01T09:30:00.123456Z")));

        Instant now = Instant.now().truncatedTo(ChronoUnit.MICROS);
        List<Certificate> toIssue = certificates.findAllById(listed.stream().filter(c -> c.getUserId().equals(awa)).map(Certificate::getId).toList());
        toIssue.forEach(c -> c.issue("Awa Diallo", now));
        certificates.saveAll(toIssue);

        assertThat(certificates.findIssuedTo(awa)).hasSize(2).allSatisfy(c -> {
            assertThat(c.getHolderName()).isEqualTo("Awa Diallo");
            assertThat(c.getIssuedAt()).isEqualTo(now);
        });
        assertThat(certificates.findByCode(toIssue.get(0).getCode())).get().extracting(Certificate::getStatus).isEqualTo(CertificateStatus.ISSUED);
    }
}
