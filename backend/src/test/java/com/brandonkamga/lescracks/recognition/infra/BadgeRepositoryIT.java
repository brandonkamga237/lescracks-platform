package com.brandonkamga.lescracks.recognition.infra;

import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.recognition.domain.Badge;
import com.brandonkamga.lescracks.recognition.domain.MemberBadge;
import com.brandonkamga.lescracks.support.PostgresIT;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** The badge catalogue V30 seeds, and one award per badge and member, against real PostgreSQL. */
@Transactional
class BadgeRepositoryIT extends PostgresIT {

    @Autowired private BadgeRepository badges;
    @Autowired private MemberBadgeRepository awards;
    @Autowired private UserRepository users;

    @Test
    @DisplayName("the migration seeds the system badges the rules award")
    void seedsSystemBadges() {
        for (String code : new String[]{Badge.EVENT_PARTICIPANT, Badge.HACKATHON_PARTICIPANT, Badge.HACKATHON_PODIUM, Badge.HACKATHON_WINNER, "FOUNDING_MEMBER"}) {
            assertThat(badges.findByCode(code)).as(code).hasValueSatisfying(badge -> assertThat(badge.isSystem()).isTrue());
        }
    }

    @Test
    @DisplayName("a member holds a badge once, and the catalogue counts its holders")
    void oneAwardPerMember() {
        User awa = users.saveAndFlush(User.builder().email("awa.badge@example.com").firstName("Awa").lastName("D").passwordHash("h").build());
        Badge winner = badges.findByCode(Badge.HACKATHON_WINNER).orElseThrow();
        awards.saveAndFlush(MemberBadge.builder().badge(winner).userId(awa.getId()).build());

        assertThat(awards.countHoldersByBadge()).anySatisfy(row -> {
            assertThat(((Number) row[0]).longValue()).isEqualTo(winner.getId());
            assertThat(((Number) row[1]).longValue()).isGreaterThanOrEqualTo(1);
        });
        assertThatThrownBy(() -> awards.saveAndFlush(MemberBadge.builder().badge(winner).userId(awa.getId()).build()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
