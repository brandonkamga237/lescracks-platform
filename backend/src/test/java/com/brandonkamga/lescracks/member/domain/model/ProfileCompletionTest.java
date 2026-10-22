package com.brandonkamga.lescracks.member.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class ProfileCompletionTest {

    @Test
    @DisplayName("an empty profile lists everything to fill, phone first")
    void freshAccount() {
        ProfileCompletion completion = ProfileCompletion.of(MemberProfile.empty(1L));

        assertThat(completion.percent()).isZero();
        assertThat(completion.missing()).containsExactly("PHONE", "SITUATION", "INTERESTS", "GOAL", "CITY", "AVATAR", "BIO");
    }

    @Test
    @DisplayName("each answered question moves the gauge, up to 100 %")
    void filledProfile() {
        MemberProfile user = MemberProfile.builder().accountId(1L)
                .phone("+237677123456").country("CM").situation(MemberSituation.STUDENT).goal(MemberGoal.FIND_JOB)
                .interests(Set.of(1L)).location("Douala").build();

        assertThat(ProfileCompletion.of(user).percent()).isEqualTo(71);

        user.setAvatarUrl("avatar.png");
        user.setBio("Développeuse backend.");
        assertThat(ProfileCompletion.of(user).percent()).isEqualTo(100);
        assertThat(ProfileCompletion.of(user).missing()).isEmpty();
    }
}
