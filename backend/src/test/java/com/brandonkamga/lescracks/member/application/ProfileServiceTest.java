package com.brandonkamga.lescracks.member.application;

import com.brandonkamga.lescracks.account.application.AccountDirectoryImpl;
import com.brandonkamga.lescracks.account.application.Arrival;
import com.brandonkamga.lescracks.account.application.InMemoryAccountStore;
import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AuthProvider;
import com.brandonkamga.lescracks.member.domain.model.MemberGoal;
import com.brandonkamga.lescracks.member.domain.model.MemberProfile;
import com.brandonkamga.lescracks.member.domain.model.MemberSituation;
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
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 1, 2, 3};

    private final InMemoryAccountStore accounts = new InMemoryAccountStore();
    private final InMemoryMemberProfileStore profiles = new InMemoryMemberProfileStore();
    @Mock private StorageService storage;
    @Mock private TaxonomyService taxonomy;

    private ProfileServiceImpl service;
    private Long id;

    @BeforeEach
    void setUp() {
        service = new ProfileServiceImpl(new AccountDirectoryImpl(accounts), profiles, storage, taxonomy);
        id = accounts.save(Account.builder().email("eric@example.com").firstName("Eric").lastName("T").provider(AuthProvider.GOOGLE).build()).getId();
    }

    private MemberProfile stored() {
        return profiles.stored(id);
    }

    private void given(MemberProfile profile) {
        profiles.save(profile.toBuilder().accountId(id).build());
    }

    private static Category category(long id) {
        Category category = new Category();
        category.setId(id);
        return category;
    }

    @Test
    @DisplayName("a member who never filled anything sees an empty profile, not an error")
    void emptyProfile() {
        MemberView view = service.view("eric@example.com");

        assertThat(view.account().getFirstName()).isEqualTo("Eric");
        assertThat(view.profile().getOnboardedAt()).isNull();
        assertThat(view.completion().percent()).isZero();
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
        assertThat(stored().getOnboardedAt()).isNotNull();
        assertThat(accounts.stored(id).getSignupPath()).isEqualTo("/ressources/docker");
    }

    @Test
    @DisplayName("« Plus tard » saves nothing but still closes the welcome")
    void laterClosesTheWelcome() {
        service.onboard("eric@example.com", new OnboardingAnswers(null, null, null, null, null, null, null));

        assertThat(stored().getOnboardedAt()).isNotNull();
        assertThat(stored().getPhone()).isNull();
    }

    @Test
    @DisplayName("a wrong number or an unknown category is refused, and nothing is marked as done")
    void refusesBadAnswers() {
        assertThatThrownBy(() -> service.onboard("eric@example.com", new OnboardingAnswers("+237 12", null, null, null, null, null, null)))
                .isInstanceOf(BadRequestException.class);
        when(taxonomy.requireCategory(99L)).thenThrow(new NotFoundException("Category", "id", 99L));
        assertThatThrownBy(() -> service.onboard("eric@example.com", new OnboardingAnswers(null, null, null, Set.of(99L), null, null, null)))
                .isInstanceOf(NotFoundException.class);
        assertThat(profiles.find(id)).isEmpty();
    }

    @Test
    @DisplayName("a section saves only its own fields; names go to the account, the rest to the profile")
    void partialUpdate() {
        given(MemberProfile.builder().bio("Dev Java").location("Douala").build());

        service.update("eric@example.com", new ProfileChanges(" Éric ", null, null, " Back-end ", null, null, null, null, null, null, null, null));

        assertThat(accounts.stored(id).getFirstName()).isEqualTo("Éric");
        assertThat(accounts.stored(id).getLastName()).isEqualTo("T");
        assertThat(stored().getBio()).isEqualTo("Back-end");
        assertThat(stored().getLocation()).isEqualTo("Douala");
    }

    @Test
    @DisplayName("public profile choices change one by one; an absent choice stays as it was")
    void visibilityChoices() {
        given(MemberProfile.builder().publicLocation(true).build());

        service.update("eric@example.com", new ProfileChanges(null, null, null, null, null, null, null, null, null, null, null,
                new ProfileVisibility(true, null, false)));

        assertThat(stored().isPublicBio()).isTrue();
        assertThat(stored().isPublicLocation()).isTrue();
        assertThat(stored().isPublicLinks()).isFalse();
    }

    @Test
    @DisplayName("an empty optional field is cleared, an empty name is refused")
    void clearingAndRequiredFields() {
        given(MemberProfile.builder().location("Douala").build());

        service.update("eric@example.com", new ProfileChanges(null, null, null, null, "", null, null, null, null, null, null, null));
        assertThat(stored().getLocation()).isNull();

        assertThatThrownBy(() -> service.update("eric@example.com",
                new ProfileChanges(" ", null, null, null, null, null, null, null, null, null, null, null)))
                .isInstanceOf(BadRequestException.class);
        assertThat(accounts.stored(id).getFirstName()).isEqualTo("Eric");
    }

    @Test
    @DisplayName("a new photo is stored with its real type and the previous one is deleted, even if that cleanup fails")
    void replacesThePhoto() {
        given(MemberProfile.builder().avatarUrl("old.jpg").build());
        when(storage.store("me.jpg", JPEG, "image/jpeg")).thenReturn("new.jpg");
        doThrow(new IllegalStateException("minio down")).when(storage).delete("old.jpg");

        service.updateAvatar("eric@example.com", "me.jpg", JPEG);

        assertThat(stored().getAvatarUrl()).isEqualTo("new.jpg");
        verify(storage).delete("old.jpg");
    }

    @Test
    @DisplayName("removing the photo deletes our copy; an external photo is only forgotten")
    void removesThePhoto() {
        given(MemberProfile.builder().avatarUrl("https://lh3.googleusercontent.com/a/x").build());

        service.removeAvatar("eric@example.com");

        assertThat(stored().getAvatarUrl()).isNull();
        verify(storage, never()).delete("https://lh3.googleusercontent.com/a/x");
    }

    @Test
    @DisplayName("the sign-up answers are kept; a mistyped number refuses them")
    void signUpAnswers() {
        service.recordSignUp(id, "+237 6 77 12 34 56", true);
        assertThat(stored().getCountry()).isEqualTo("CM");
        assertThat(stored().isMarketingConsent()).isTrue();

        assertThatThrownBy(() -> service.recordSignUp(id, "+237 12", null)).isInstanceOf(BadRequestException.class);
    }
}
