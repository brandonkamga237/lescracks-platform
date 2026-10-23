package com.brandonkamga.lescracks.recognition.application;

import com.brandonkamga.lescracks.event.application.RegistrationService;
import com.brandonkamga.lescracks.event.application.RegistrationView;
import com.brandonkamga.lescracks.event.domain.model.Registration;
import com.brandonkamga.lescracks.event.domain.model.RegistrationStatus;
import com.brandonkamga.lescracks.mail.domain.BadgeAwardedEmail;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.recognition.domain.model.Badge;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BadgeServiceTest {

    private final InMemoryRecognition.Badges badges = new InMemoryRecognition.Badges();
    private final InMemoryRecognition.Awards awards = new InMemoryRecognition.Awards();
    private final MemberDirectory people = mock(MemberDirectory.class);
    private final RegistrationService registrations = mock(RegistrationService.class);
    private final Mailer mailer = mock(Mailer.class);
    private final BadgeService service = new BadgeServiceImpl(badges, awards, people, registrations, mailer);
    private Badge system;

    @BeforeEach
    void setUp() {
        badges.awards = awards;
        system = badges.save(Badge.builder().code(Badge.HACKATHON_WINNER).name("Lauréat").description("d").system(true).build());
    }

    @Test
    @DisplayName("a custom badge gets a code from its name and only an icon the site can draw")
    void createsCustomBadges() {
        Badge badge = service.create(new BadgeDraft(" Mentor du mois ", "A aidé les autres", "heart"));

        assertThat(badges.findById(badge.getId())).get().satisfies(stored -> {
            assertThat(stored.getCode()).isEqualTo("CUSTOM_MENTOR-DU-MOIS");
            assertThat(stored.getName()).isEqualTo("Mentor du mois");
            assertThat(stored.isSystem()).isFalse();
        });
        assertThatThrownBy(() -> service.create(new BadgeDraft("X", "Y", "skull"))).isInstanceOf(BadRequestException.class);
        assertThat(service.create(new BadgeDraft("Mentor du mois", "Encore", null)).getCode()).isEqualTo("CUSTOM_MENTOR-DU-MOIS-2");
    }

    @Test
    @DisplayName("a system badge is neither edited nor deleted: its rules rely on it; a custom one is")
    void protectsSystemBadges() {
        assertThatThrownBy(() -> service.update(system.getId(), new BadgeDraft("A", "B", "award"))).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.delete(system.getId())).isInstanceOf(BadRequestException.class);
        assertThat(badges.findById(system.getId())).isPresent();

        Badge custom = service.create(new BadgeDraft("Mentor", "d", "heart"));
        service.update(custom.getId(), new BadgeDraft(" Guide ", " d2 ", "star"));
        assertThat(badges.findById(custom.getId())).get().extracting(Badge::getName, Badge::getIcon).containsExactly("Guide", "star");
        service.delete(custom.getId());
        assertThat(badges.findById(custom.getId())).isEmpty();
    }

    @Test
    @DisplayName("awarding twice keeps the first award, and the catalogue counts holders")
    void awardsOnce() {
        service.award(Badge.HACKATHON_WINNER, 7L, "Hackathon 001");
        var again = service.award(Badge.HACKATHON_WINNER, 7L, "autre");

        assertThat(again.getReason()).isEqualTo("Hackathon 001");
        assertThat(awards.size()).isEqualTo(1);
        assertThat(service.countHolders()).isEqualTo(Map.of(system.getId(), 1L));
        service.revoke(system.getId(), 7L);
        assertThat(service.listOf(7L)).isEmpty();
    }

    @Test
    @DisplayName("awarding by email needs an existing member; holders come with their member")
    void awardsByEmail() {
        when(people.find("ghost@example.com")).thenReturn(Optional.empty());
        Member awa = Member.builder().id(3L).email("awa@example.com").firstName("Awa").build();
        when(people.find("awa@example.com")).thenReturn(Optional.of(awa));
        when(people.findAll(any())).thenReturn(Map.of(3L, awa));

        assertThatThrownBy(() -> service.awardByEmail(system.getId(), "ghost@example.com", null)).isInstanceOf(BadRequestException.class);
        service.awardByEmail(system.getId(), "awa@example.com", "  ");

        assertThat(service.listHolders(system.getId())).singleElement().satisfies(holder -> {
            assertThat(holder.member().getFirstName()).isEqualTo("Awa");
            assertThat(holder.award().getReason()).isNull();
        });
    }

    @Test
    @DisplayName("a badge given by hand emails the member once; a rule gives it silently")
    void notifiesOnlyNewHolders() {
        Member awa = Member.builder().id(3L).email("awa@example.com").firstName("Awa").build();
        when(people.find("awa@example.com")).thenReturn(Optional.of(awa));

        service.awardByEmail(system.getId(), "awa@example.com", " Hackathon 001 ");
        service.awardByEmail(system.getId(), "awa@example.com", "encore");
        service.award(Badge.HACKATHON_WINNER, 9L, null);

        verify(mailer, times(1)).send(new BadgeAwardedEmail("awa@example.com", "Awa", "Lauréat", "d", "Hackathon 001", 3L));
        verify(mailer, times(1)).send(any());
    }

    @Test
    @DisplayName("a grant reaches pasted emails and the people marked present, skips holders, and names unknown addresses")
    void grantsToMany() {
        Member awa = Member.builder().id(1L).email("awa@example.com").firstName("Awa").build();
        Member kofi = Member.builder().id(2L).email("kofi@example.com").firstName("Kofi").build();
        Member lina = Member.builder().id(3L).email("lina@example.com").firstName("Lina").build();
        when(people.findAllByEmail(any())).thenReturn(Map.of("awa@example.com", awa));
        when(registrations.listForEvent(9L)).thenReturn(List.of(
                new RegistrationView(Registration.builder().status(RegistrationStatus.ATTENDED).build(), kofi),
                new RegistrationView(Registration.builder().status(RegistrationStatus.REGISTERED).build(), lina)));
        service.award(Badge.HACKATHON_WINNER, 2L, null);

        BulkAward result = service.awardMany(system.getId(),
                new BadgeGrant(List.of(" AWA@example.com ", "ghost@example.com"), 9L, true, "Présents"));

        assertThat(result).isEqualTo(new BulkAward(1, 1, List.of("ghost@example.com")));
        assertThat(awards.find(system.getId(), 1L)).get().extracting(award -> award.getReason()).isEqualTo("Présents");
        assertThat(awards.find(system.getId(), 3L)).isEmpty();
        verify(mailer, times(1)).send(any());
        verify(mailer, never()).send(new BadgeAwardedEmail("kofi@example.com", "Kofi", "Lauréat", "d", "Présents", 2L));
        assertThatThrownBy(() -> service.awardMany(system.getId(), new BadgeGrant(List.of(), null, false, null)))
                .isInstanceOf(BadRequestException.class);
    }
}
