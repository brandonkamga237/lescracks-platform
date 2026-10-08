package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.api.dto.OnboardingRequest;
import com.brandonkamga.lescracks.identity.api.dto.SignupContext;
import com.brandonkamga.lescracks.identity.infra.UserRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock private UserRepository users;
    @Mock private PasswordEncoder passwords;
    @Mock private StorageService storage;
    @Mock private TaxonomyService taxonomy;

    private UserProfileServiceImpl service;
    private User member;

    @BeforeEach
    void setUp() {
        service = new UserProfileServiceImpl(users, passwords, storage, taxonomy);
        member = User.builder().id(5L).email("eric@example.com").firstName("Eric").lastName("T").provider(AuthProvider.GOOGLE).build();
        when(users.findByEmailIgnoreCase("eric@example.com")).thenReturn(Optional.of(member));
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

        service.onboard("eric@example.com", new OnboardingRequest("+237 6 77 12 34 56", MemberSituation.CAREER_CHANGE,
                MemberGoal.FIND_JOB, Set.of(3L), " Douala ", true, new SignupContext("/ressources/docker", "fr-CM", "Africa/Douala")));

        assertThat(member.getPhone()).isEqualTo("+237677123456");
        assertThat(member.getCountry()).isEqualTo("CM");
        assertThat(member.getInterests()).containsExactly(3L);
        assertThat(member.getLocation()).isEqualTo("Douala");
        assertThat(member.isMarketingConsent()).isTrue();
        assertThat(member.getSignupPath()).isEqualTo("/ressources/docker");
        assertThat(member.getOnboardedAt()).isNotNull();
    }

    @Test
    @DisplayName("« Plus tard » saves nothing but still closes the welcome")
    void laterClosesTheWelcome() {
        service.onboard("eric@example.com", new OnboardingRequest(null, null, null, null, null, null, null));

        assertThat(member.getOnboardedAt()).isNotNull();
        assertThat(member.getPhone()).isNull();
    }

    @Test
    @DisplayName("the arrival context is recorded once and never overwritten")
    void contextIsKeptFromTheFirstVisit() {
        member.setSignupPath("/cracklab");

        service.onboard("eric@example.com", new OnboardingRequest(null, null, null, null, null, null, new SignupContext("/talk", "fr", "Europe/Paris")));

        assertThat(member.getSignupPath()).isEqualTo("/cracklab");
        assertThat(member.getSignupTimezone()).isEqualTo("Europe/Paris");
    }

    @Test
    @DisplayName("a wrong number or an unknown category is refused, and nothing is marked as done")
    void refusesBadAnswers() {
        assertThatThrownBy(() -> service.onboard("eric@example.com", new OnboardingRequest("+237 12", null, null, null, null, null, null)))
                .isInstanceOf(BadRequestException.class);
        when(taxonomy.requireCategory(99L)).thenThrow(new NotFoundException("Category", "id", 99L));
        assertThatThrownBy(() -> service.onboard("eric@example.com", new OnboardingRequest(null, null, null, Set.of(99L), null, null, null)))
                .isInstanceOf(NotFoundException.class);
        assertThat(member.getOnboardedAt()).isNull();
    }
}
