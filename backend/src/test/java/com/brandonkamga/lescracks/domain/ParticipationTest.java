package com.brandonkamga.lescracks.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The status and its date move together, because the database refuses the pair apart:
 * COMPLETED without a date, or a date without COMPLETED, both violate a check constraint.
 * Enforcing it here means a caller learns the rule before the flush rather than at it.
 */
class ParticipationTest {

    private Participation onTheProgramme() {
        return Participation.builder()
                .target(EnrolmentTarget.MENTORSHIP)
                .status(ParticipationStatus.IN_PROGRESS)
                .build();
    }

    @Test
    @DisplayName("completing sets the status and the date in one move")
    void completeSetsBoth() {
        Participation participation = onTheProgramme();

        participation.complete(LocalDate.of(2026, 3, 14));

        assertThat(participation.getStatus()).isEqualTo(ParticipationStatus.COMPLETED);
        assertThat(participation.getCompletedAt()).isEqualTo(LocalDate.of(2026, 3, 14));
        assertThat(participation.isCompleted()).isTrue();
    }

    @Test
    @DisplayName("completing without a date means today, never no date")
    void completeDefaultsToToday() {
        Participation participation = onTheProgramme();

        participation.complete(null);

        assertThat(participation.getCompletedAt()).isEqualTo(LocalDate.now());
    }

    @Test
    @DisplayName("abandoning clears the date, so no abandoned row looks finished")
    void abandonClearsTheDate() {
        Participation participation = onTheProgramme();
        participation.complete(LocalDate.now());

        participation.abandon();

        assertThat(participation.getStatus()).isEqualTo(ParticipationStatus.ABANDONED);
        assertThat(participation.getCompletedAt()).isNull();
        assertThat(participation.isCompleted()).isFalse();
    }

    @Test
    @DisplayName("an event participation is labelled by the event")
    void labelsAnEventByItsTitle() {
        Participation participation = Participation.builder()
                .target(EnrolmentTarget.EVENT)
                .event(Event.builder().title("Bootcamp Spring").build())
                .status(ParticipationStatus.IN_PROGRESS)
                .build();

        assertThat(participation.label()).isEqualTo("Bootcamp Spring");
    }

    @Test
    @DisplayName("a 360 participation is labelled by the programme")
    void labelsTheProgrammeByName() {
        assertThat(onTheProgramme().label()).isEqualTo("Accompagnement 360");
    }

    @Test
    @DisplayName("no attestation yet is an empty optional, never a null")
    void attestationIsOptional() {
        assertThat(onTheProgramme().attestation()).isEmpty();
    }
}
