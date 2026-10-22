package com.brandonkamga.lescracks.identity.domain.member;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.storage.domain.StorageService;
import com.brandonkamga.lescracks.taxonomy.domain.Category;
import com.brandonkamga.lescracks.taxonomy.domain.TaxonomyService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    private final InMemoryUserStore users = new InMemoryUserStore();
    @Mock private StorageService storage;
    @Mock private TaxonomyService taxonomy;

    private UserProfileServiceImpl service;
    private User member;

    @BeforeEach
    void setUp() {
        service = new UserProfileServiceImpl(users, storage, taxonomy);
        member = User.builder().id(5L).email("eric@example.com").firstName("Eric").lastName("T").provider(AuthProvider.GOOGLE).build();
        users.save(member);
    }

    private User stored() {
        return users.stored(5L);
    }

    private static Category category(long id) {
        Category category = new Category();
        category.setId(id);
        return category;
    }

    @Test
    @DisplayName("the welcome answers fill the profile, the number brings its country, and the welcome is not shown again")
    void answersFillTheProfile() {
        when(taxonomy.requireCategory(3L)).thenReturn(category(3));

        service.onboard("eric@example.com", new OnboardingAnswers("+237 6 77 12 34 56", MemberSituation.CAREER_CHANGE,
                MemberGoal.FIND_JOB, Set.of(3L), " Douala ", true, new Arrival("/ressources/docker", "fr-CM", "Africa/Douala")));

        assertThat(stored().getPhone()).isEqualTo("+237677123456");
        assertThat(stored().getCountry()).isEqualTo("CM");
        assertThat(stored().getInterests()).containsExactly(3L);
        assertThat(stored().getLocation()).isEqualTo("Douala");
        assertThat(stored().isMarketingConsent()).isTrue();
        assertThat(stored().getSignupPath()).isEqualTo("/ressources/docker");
        assertThat(stored().getOnboardedAt()).isNotNull();
    }

    @Test
    @DisplayName("« Plus tard » saves nothing but still closes the welcome")
    void laterClosesTheWelcome() {
        service.onboard("eric@example.com", new OnboardingAnswers(null, null, null, null, null, null, null));

        assertThat(stored().getOnboardedAt()).isNotNull();
        assertThat(stored().getPhone()).isNull();
    }

    @Test
    @DisplayName("the arrival context is recorded once and never overwritten")
    void contextIsKeptFromTheFirstVisit() {
        member.setSignupPath("/blog");
        users.save(member);

        service.onboard("eric@example.com", new OnboardingAnswers(null, null, null, null, null, null, new Arrival("/talk", "fr", "Europe/Paris")));

        assertThat(stored().getSignupPath()).isEqualTo("/blog");
        assertThat(stored().getSignupTimezone()).isEqualTo("Europe/Paris");
    }

    @Test
    @DisplayName("a wrong number or an unknown category is refused, and nothing is marked as done")
    void refusesBadAnswers() {
        assertThatThrownBy(() -> service.onboard("eric@example.com", new OnboardingAnswers("+237 12", null, null, null, null, null, null)))
                .isInstanceOf(BadRequestException.class);
        when(taxonomy.requireCategory(99L)).thenThrow(new NotFoundException("Category", "id", 99L));
        assertThatThrownBy(() -> service.onboard("eric@example.com", new OnboardingAnswers(null, null, null, Set.of(99L), null, null, null)))
                .isInstanceOf(NotFoundException.class);
        assertThat(stored().getOnboardedAt()).isNull();
    }

    @Test
    @DisplayName("a section saves only its own fields: the rest of the profile stays as it was")
    void partialUpdate() {
        member.setBio("Dev Java");
        member.setLocation("Douala");
        users.save(member);

        service.update("eric@example.com", new ProfileChanges(null, null, null, " Back-end ", null, null, null, null, null, null, null, null));

        assertThat(stored().getFirstName()).isEqualTo("Eric");
        assertThat(stored().getBio()).isEqualTo("Back-end");
        assertThat(stored().getLocation()).isEqualTo("Douala");
    }

    @Test
    @DisplayName("public profile choices change one by one; an absent choice stays as it was")
    void visibilityChoices() {
        member.setPublicLocation(true);
        users.save(member);

        service.update("eric@example.com", new ProfileChanges(null, null, null, null, null, null, null, null, null, null, null,
                new ProfileVisibility(true, null, false)));

        assertThat(stored().isPublicBio()).isTrue();
        assertThat(stored().isPublicLocation()).isTrue();
        assertThat(stored().isPublicLinks()).isFalse();
    }

    @Test
    @DisplayName("an empty optional field is cleared, an empty name is refused")
    void clearingAndRequiredFields() {
        member.setLocation("Douala");
        users.save(member);

        service.update("eric@example.com", new ProfileChanges(null, null, null, null, "", null, null, null, null, null, null, null));
        assertThat(stored().getLocation()).isNull();

        assertThatThrownBy(() -> service.update("eric@example.com",
                new ProfileChanges(" ", null, null, null, null, null, null, null, null, null, null, null)))
                .isInstanceOf(BadRequestException.class);
        assertThat(stored().getFirstName()).isEqualTo("Eric");
    }
}
