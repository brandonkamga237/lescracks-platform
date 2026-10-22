package com.brandonkamga.lescracks.member.infra.persistence;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.member.application.MemberStatistics;
import com.brandonkamga.lescracks.member.domain.model.MemberGoal;
import com.brandonkamga.lescracks.member.domain.model.MemberProfile;
import com.brandonkamga.lescracks.member.domain.model.MemberSituation;
import com.brandonkamga.lescracks.member.domain.port.MemberProfileStore;
import com.brandonkamga.lescracks.support.PostgresIT;
import com.brandonkamga.lescracks.taxonomy.domain.Category;
import com.brandonkamga.lescracks.taxonomy.infra.CategoryRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/** Every statement of the profile adapter and of the member figures, against PostgreSQL. */
@Transactional
class JdbcMemberProfileStoreIT extends PostgresIT {

    @Autowired private AccountStore accounts;
    @Autowired private MemberProfileStore profiles;
    @Autowired private MemberStatistics statistics;
    @Autowired private CategoryRepository categories;

    private Long theme;
    private Long other;

    @BeforeEach
    void setUp() {
        theme = categories.saveAndFlush(category("Profil IT")).getId();
        other = categories.saveAndFlush(category("Profil IT bis")).getId();
    }

    private static Category category(String name) {
        Category category = new Category();
        category.setName(name);
        category.setSlug(name.toLowerCase().replace(' ', '-'));
        return category;
    }

    private Long account(String email) {
        return accounts.save(Account.builder().email(email).firstName("A").lastName("B").passwordHash("h").build()).getId();
    }

    @Test
    @DisplayName("a profile goes in and comes back whole, links and interests included")
    void roundTrip() {
        Long id = account("profile@example.com");
        MemberProfile saved = profiles.save(MemberProfile.builder().accountId(id).username("awa").avatarUrl("a.jpg")
                .bio("Dev").location("Douala").socialLinks(Map.of("github", "https://github.com/awa"))
                .publicBio(true).phone("+237677123456").country("CM").situation(MemberSituation.STUDENT)
                .goal(MemberGoal.FIND_JOB).interests(Set.of(theme)).marketingConsent(true)
                .onboardedAt(Instant.now().truncatedTo(ChronoUnit.MICROS))
                .createdAt(Instant.now().truncatedTo(ChronoUnit.MICROS)).updatedAt(Instant.now().truncatedTo(ChronoUnit.MICROS)).build());

        assertThat(profiles.find(id).orElseThrow()).usingRecursiveComparison().isEqualTo(saved);
    }

    @Test
    @DisplayName("saving again replaces the profile and changes the interests by difference")
    void upsert() {
        Long id = account("upsert@example.com");
        profiles.save(MemberProfile.builder().accountId(id).bio("Avant").interests(Set.of(theme)).build());

        profiles.save(MemberProfile.builder().accountId(id).bio("Après").interests(Set.of(other)).build());
        assertThat(profiles.find(id).orElseThrow().getBio()).isEqualTo("Après");
        assertThat(profiles.find(id).orElseThrow().getInterests()).containsExactly(other);

        profiles.save(MemberProfile.builder().accountId(id).interests(Set.of()).build());
        assertThat(profiles.find(id).orElseThrow().getInterests()).isEmpty();
    }

    @Test
    @DisplayName("a page of profiles loads in one go; members without a profile are absent")
    void batch() {
        Long a = account("batch-a@example.com");
        Long b = account("batch-b@example.com");
        Long none = account("batch-none@example.com");
        profiles.save(MemberProfile.builder().accountId(a).interests(Set.of(theme, other)).build());
        profiles.save(MemberProfile.builder().accountId(b).build());

        List<MemberProfile> found = profiles.findAll(List.of(a, b, none));

        assertThat(found).extracting(MemberProfile::getAccountId).containsExactlyInAnyOrder(a, b);
        assertThat(found.stream().filter(p -> p.getAccountId().equals(a)).findFirst().orElseThrow().getInterests())
                .containsExactlyInAnyOrder(theme, other);
    }

    @Test
    @DisplayName("the portrait counts situations, goals, countries, interests and who finished the welcome")
    void statistics() {
        long students = statistics.bySituation().getOrDefault("STUDENT", 0L);
        long cameroon = statistics.byCountry().getOrDefault("CM", 0L);
        Long id = account("portrait@example.com");
        Long idle = account("idle@example.com");
        profiles.save(MemberProfile.builder().accountId(id).situation(MemberSituation.STUDENT).goal(MemberGoal.FIND_JOB)
                .country("CM").interests(Set.of(theme)).onboardedAt(Instant.now()).build());

        assertThat(statistics.bySituation().get("STUDENT")).isEqualTo(students + 1);
        assertThat(statistics.byCountry().get("CM")).isEqualTo(cameroon + 1);
        assertThat(statistics.byInterest().get(theme)).isEqualTo(1);
        assertThat(statistics.countOnboarded(List.of(id, idle))).isEqualTo(1);
    }
}
