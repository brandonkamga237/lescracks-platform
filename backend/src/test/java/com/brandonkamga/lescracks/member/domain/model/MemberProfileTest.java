package com.brandonkamga.lescracks.member.domain.model;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MemberProfileTest {

    @Test
    @DisplayName("null leaves the number alone, blank removes it with its country, a bad number is refused")
    void phone() {
        MemberProfile profile = MemberProfile.empty(1L);
        profile.changePhone("+33 6 12 34 56 78");
        assertThat(profile.getCountry()).isEqualTo("FR");

        profile.changePhone(null);
        assertThat(profile.getPhone()).isEqualTo("+33612345678");

        profile.changePhone(" ");
        assertThat(profile.getPhone()).isNull();
        assertThat(profile.getCountry()).isNull();

        assertThatThrownBy(() -> profile.changePhone("12")).isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("the welcome is marked done once, at the first answer")
    void onboardedOnce() {
        MemberProfile profile = MemberProfile.empty(1L);
        profile.markOnboarded();
        var first = profile.getOnboardedAt();
        profile.markOnboarded();

        assertThat(profile.getOnboardedAt()).isEqualTo(first);
    }
}
