package com.brandonkamga.lescracks.community.api;

import com.brandonkamga.lescracks.community.api.dto.MemberActivityResponse;
import com.brandonkamga.lescracks.community.application.MemberActivity;
import com.brandonkamga.lescracks.event.application.MyEvent;
import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventType;
import com.brandonkamga.lescracks.event.domain.model.Registration;
import com.brandonkamga.lescracks.event.domain.model.RegistrationStatus;
import com.brandonkamga.lescracks.event.domain.model.Submission;
import com.brandonkamga.lescracks.event.domain.model.SubmissionStatus;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MemberActivityResponseTest {

    @Test
    @DisplayName("each event carries the member's project for it, if any")
    void attachesProjectsToTheirEvent() {
        Event hackathon = Event.builder().id(1L).slug("h").title("Hackathon").type(EventType.HACKATHON).startDate(Instant.now()).build();
        Event workshop = Event.builder().id(2L).slug("w").title("Atelier").type(EventType.WORKSHOP).startDate(Instant.now()).build();
        MemberActivity activity = new MemberActivity(
                List.of(new MyEvent(Registration.builder().status(RegistrationStatus.REGISTERED).build(), hackathon),
                        new MyEvent(Registration.builder().status(RegistrationStatus.ATTENDED).build(), workshop)),
                List.of(Submission.builder().id(5L).eventId(1L).title("Mondje").status(SubmissionStatus.ACCEPTED).rank(1).build()),
                List.of(), List.of(), 4);

        MemberActivityResponse response = MemberActivityResponse.of(activity);

        assertThat(response.events().get(0).project()).isEqualTo(new MemberActivityResponse.Project(5L, "Mondje", SubmissionStatus.ACCEPTED, 1));
        assertThat(response.events().get(1).project()).isNull();
        assertThat(response.comments()).isEqualTo(4);
    }
}
