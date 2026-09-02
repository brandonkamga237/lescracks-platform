package com.brandonkamga.lescracks.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ApplicationTest {

    private Application pending() {
        return Application.builder()
                .target(EnrolmentTarget.MENTORSHIP)
                .fullName("Ada Lovelace")
                .email("ada@lescracks.test")
                .status(ApplicationStatus.PENDING)
                .build();
    }

    @ParameterizedTest
    @EnumSource(value = ApplicationStatus.class, names = {"ACCEPTED", "REJECTED"})
    @DisplayName("deciding records the outcome and when it was taken")
    void decidingStampsTheDecision(ApplicationStatus outcome) {
        Application application = pending();

        application.decide(outcome);

        assertThat(application.getStatus()).isEqualTo(outcome);
        assertThat(application.getDecidedAt()).isNotNull();
        assertThat(application.isPending()).isFalse();
    }

    @Test
    @DisplayName("PENDING is not a decision")
    void refusesPendingAsAnOutcome() {
        assertThatThrownBy(() -> pending().decide(ApplicationStatus.PENDING))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("ACCEPTED or REJECTED");
    }

    @Test
    @DisplayName("neither is nothing")
    void refusesNullAsAnOutcome() {
        assertThatThrownBy(() -> pending().decide(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("a refused decision leaves the application untouched")
    void leavesTheApplicationIntactWhenRefused() {
        Application application = pending();

        assertThatThrownBy(() -> application.decide(null)).isInstanceOf(IllegalArgumentException.class);

        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.PENDING);
        assertThat(application.getDecidedAt()).isNull();
    }
}
