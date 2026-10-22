package com.brandonkamga.lescracks.event.domain;

import com.brandonkamga.lescracks.event.infra.EventSubmissionRepository;
import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.identity.domain.member.UserDirectory;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EventSubmissionServiceTest {

    @Mock private EventSubmissionRepository submissions;
    @Mock private EventService events;
    @Mock private EventRegistrationService registrations;
    @Mock private UserDirectory people;

    private EventSubmissionServiceImpl service;
    private Event hackathon;
    private final User owner = member(1L, "awa@example.com");
    private final User teammate = member(2L, "kofi@example.com");

    private static User member(Long id, String email) {
        return User.builder().id(id).email(email).firstName("M" + id).lastName("L").passwordHash("hash").build();
    }

    private static ProjectDraft draft(List<String> teammates) {
        return new ProjectDraft("Mondje", "https://github.com/awa/mondje", "", "Le carnet", teammates);
    }

    @BeforeEach
    void setUp() {
        service = new EventSubmissionServiceImpl(submissions, events, registrations, people);
        hackathon = Event.builder().id(9L).status(EventStatus.PUBLISHED).acceptsSubmissions(true).maxTeamSize(4)
                .startDate(Instant.now().minus(1, ChronoUnit.DAYS)).endDate(Instant.now().plus(10, ChronoUnit.DAYS)).build();
        when(events.require(9L)).thenReturn(hackathon);
        when(people.require("awa@example.com")).thenReturn(owner);
        when(people.find("kofi@example.com")).thenReturn(Optional.of(teammate));
        when(people.findAll(any())).thenReturn(Map.of(1L, owner, 2L, teammate));
        when(submissions.findByEventAndMember(any(), any())).thenReturn(Optional.empty());
        when(submissions.save(any())).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    @DisplayName("a project names its owner and teammates, and signs every one of them up for the event")
    void submitsWithTheTeam() {
        SubmissionView view = service.submit(9L, "awa@example.com", draft(List.of("Kofi@Example.com", "awa@example.com")));

        assertThat(view.submission().getMembers()).extracting(TeamMember::userId).containsExactlyInAnyOrder(1L, 2L);
        assertThat(view.team()).extracting(User::getId).containsExactly(1L, 2L);
        verify(registrations).ensureRegistered(hackathon, 1L);
        verify(registrations).ensureRegistered(hackathon, 2L);
    }

    @Test
    @DisplayName("an event that takes no projects, or whose deadline is past, refuses the submission")
    void refusesWhenClosed() {
        hackathon.setAcceptsSubmissions(false);
        assertThatThrownBy(() -> service.submit(9L, "awa@example.com", draft(List.of()))).isInstanceOf(BadRequestException.class);

        hackathon.setAcceptsSubmissions(true);
        hackathon.setSubmissionDeadline(Instant.now().minus(1, ChronoUnit.MINUTES));
        assertThatThrownBy(() -> service.submit(9L, "awa@example.com", draft(List.of()))).isInstanceOf(BadRequestException.class);
        verify(submissions, never()).save(any());
    }

    @Test
    @DisplayName("a teammate must already have an account, and the team cannot exceed the event's size")
    void checksTheTeam() {
        when(people.find("ghost@example.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.submit(9L, "awa@example.com", draft(List.of("ghost@example.com"))))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("ghost@example.com");

        hackathon.setMaxTeamSize(1);
        assertThatThrownBy(() -> service.submit(9L, "awa@example.com", draft(List.of("kofi@example.com"))))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("individuels");
    }

    @Test
    @DisplayName("nobody sits on two projects of the same event")
    void oneProjectPerPerson() {
        EventSubmission other = EventSubmission.builder().id(40L).ownerId(5L).build();
        when(submissions.findByEventAndMember(9L, 2L)).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> service.submit(9L, "awa@example.com", draft(List.of("kofi@example.com"))))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    @DisplayName("only the owner edits the project, and only until the review starts")
    void onlyTheOwnerEditsBeforeReview() {
        EventSubmission theirs = EventSubmission.builder().id(41L).ownerId(2L).event(hackathon).build();
        when(submissions.findByEventAndMember(9L, 1L)).thenReturn(Optional.of(theirs));
        assertThatThrownBy(() -> service.submit(9L, "awa@example.com", draft(List.of()))).isInstanceOf(ConflictException.class);

        EventSubmission reviewed = EventSubmission.builder().id(42L).ownerId(1L).event(hackathon).status(SubmissionStatus.UNDER_REVIEW).build();
        when(submissions.findByEventAndMember(9L, 1L)).thenReturn(Optional.of(reviewed));
        assertThatThrownBy(() -> service.submit(9L, "awa@example.com", draft(List.of()))).isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("the review sets status, score and rank, and refuses a score past 100")
    void reviews() {
        EventSubmission project = EventSubmission.builder().id(43L).ownerId(1L).event(hackathon).build();
        when(submissions.findById(43L)).thenReturn(Optional.of(project));

        SubmissionView view = service.review(43L, new ProjectReview(SubmissionStatus.ACCEPTED, 92, 1, " Superbe "));
        assertThat(view.submission().getRank()).isEqualTo(1);
        assertThat(view.submission().getReviewNote()).isEqualTo("Superbe");

        assertThatThrownBy(() -> service.review(43L, new ProjectReview(null, 120, null, null))).isInstanceOf(BadRequestException.class);
    }
}
