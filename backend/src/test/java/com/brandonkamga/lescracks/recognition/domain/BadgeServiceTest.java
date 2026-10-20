package com.brandonkamga.lescracks.recognition.domain;

import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.domain.UserDirectory;
import com.brandonkamga.lescracks.recognition.infra.BadgeRepository;
import com.brandonkamga.lescracks.recognition.infra.MemberBadgeRepository;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BadgeServiceTest {

    @Mock private BadgeRepository badges;
    @Mock private MemberBadgeRepository awards;
    @Mock private UserDirectory people;

    private BadgeServiceImpl service;
    private final Badge system = Badge.builder().id(1L).code(Badge.HACKATHON_WINNER).name("Lauréat").description("d").system(true).build();

    @BeforeEach
    void setUp() {
        service = new BadgeServiceImpl(badges, awards, people);
        when(badges.save(any())).thenAnswer(call -> call.getArgument(0));
        when(awards.save(any())).thenAnswer(call -> call.getArgument(0));
        when(badges.findById(1L)).thenReturn(Optional.of(system));
        when(badges.findByCode(Badge.HACKATHON_WINNER)).thenReturn(Optional.of(system));
    }

    @Test
    @DisplayName("a custom badge gets a code from its name and only an icon the site can draw")
    void createsCustomBadges() {
        Badge badge = service.create(new BadgeDraft(" Mentor du mois ", "A aidé les autres", "heart"));

        assertThat(badge.getCode()).isEqualTo("CUSTOM_MENTOR-DU-MOIS");
        assertThat(badge.isSystem()).isFalse();
        assertThatThrownBy(() -> service.create(new BadgeDraft("X", "Y", "skull"))).isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("a system badge is neither edited nor deleted: its rules rely on it")
    void protectsSystemBadges() {
        assertThatThrownBy(() -> service.update(1L, new BadgeDraft("A", "B", "award"))).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.delete(1L)).isInstanceOf(BadRequestException.class);
        verify(badges, never()).delete(any());
    }

    @Test
    @DisplayName("awarding twice keeps the first award")
    void awardsOnce() {
        MemberBadge first = MemberBadge.builder().badge(system).userId(7L).reason("Hackathon 001").build();
        when(awards.findByBadgeIdAndUserId(1L, 7L)).thenReturn(Optional.empty(), Optional.of(first));

        service.award(Badge.HACKATHON_WINNER, 7L, "Hackathon 001");
        assertThat(service.award(Badge.HACKATHON_WINNER, 7L, "autre")).isSameAs(first);
        verify(awards, org.mockito.Mockito.times(1)).save(any());
    }

    @Test
    @DisplayName("awarding by email needs an existing member")
    void awardsByEmail() {
        when(people.find("ghost@example.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.awardByEmail(1L, "ghost@example.com", null)).isInstanceOf(BadRequestException.class);

        when(people.find("awa@example.com")).thenReturn(Optional.of(User.builder().id(7L).email("awa@example.com").build()));
        when(awards.findByBadgeIdAndUserId(1L, 7L)).thenReturn(Optional.empty());
        assertThat(service.awardByEmail(1L, "awa@example.com", "  ").getReason()).isNull();
    }
}
