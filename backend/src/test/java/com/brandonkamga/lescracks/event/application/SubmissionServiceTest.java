package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventFormat;
import com.brandonkamga.lescracks.event.domain.model.EventStatus;
import com.brandonkamga.lescracks.event.domain.model.EventType;
import com.brandonkamga.lescracks.event.domain.model.Registration;
import com.brandonkamga.lescracks.event.domain.model.Submission;
import com.brandonkamga.lescracks.event.domain.model.SubmissionStatus;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SubmissionServiceTest {

    private final InMemoryEvents.Events events = new InMemoryEvents.Events();
    private final InMemoryEvents.Registrations registrations = new InMemoryEvents.Registrations(events);
    private final InMemoryEvents.Submissions submissions = new InMemoryEvents.Submissions();
    private final InMemoryEvents.People people = new InMemoryEvents.People();
    private final SubmissionService service = new SubmissionServiceImpl(submissions, events,
            new RegistrationServiceImpl(registrations, events, people), people);

    private Event hackathon;

    @BeforeEach
    void setUp() {
        people.add(1L, "awa@example.com", "Awa");
        people.add(2L, "kofi@example.com", "Kofi");
        people.add(3L, "binta@example.com", "Binta");
        hackathon = events.add(Event.builder().slug("hackathon").title("Hackathon").description("D").type(EventType.HACKATHON)
                .format(EventFormat.ONLINE).status(EventStatus.PUBLISHED).acceptsSubmissions(true).maxTeamSize(4)
                .startDate(Instant.now().minus(1, ChronoUnit.DAYS)).endDate(Instant.now().plus(10, ChronoUnit.DAYS)).build());
    }

    private static ProjectDraft draft(List<String> teammates) {
        return new ProjectDraft("  Mondje ", "https://github.com/awa/mondje", "", "Le carnet", teammates);
    }

    @Test
    @DisplayName("a project names its owner and teammates, owner first, and signs every one of them up for the event")
    void submitsWithTheTeam() {
        SubmissionView view = service.submit(hackathon.getId(), "awa@example.com", draft(List.of("Kofi@Example.com", "awa@example.com")));

        Submission stored = submissions.stored(view.submission().getId());
        assertThat(stored.getTitle()).isEqualTo("Mondje");
        assertThat(stored.getDemoUrl()).isNull();
        assertThat(stored.getMemberIds()).containsExactly(1L, 2L);
        assertThat(view.team()).extracting(Member::getId).containsExactly(1L, 2L);
        assertThat(registrations.findByEvent(hackathon.getId())).extracting(Registration::getUserId).containsExactlyInAnyOrder(1L, 2L);
    }

    @Test
    @DisplayName("an event that takes no projects, or whose deadline is past, refuses the submission")
    void refusesWhenClosed() {
        Event workshop = events.add(hackathon.toBuilder().id(null).slug("atelier").acceptsSubmissions(false).build());
        Event closed = events.add(hackathon.toBuilder().id(null).slug("clos").submissionDeadline(Instant.now().minusSeconds(60)).build());

        assertThatThrownBy(() -> service.submit(workshop.getId(), "awa@example.com", draft(List.of())))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("ne reçoit pas");
        assertThatThrownBy(() -> service.submit(closed.getId(), "awa@example.com", draft(List.of())))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("closes");
    }

    @Test
    @DisplayName("a teammate must already have an account, and the team cannot exceed the event's size")
    void checksTheTeam() {
        assertThatThrownBy(() -> service.submit(hackathon.getId(), "awa@example.com", draft(List.of("inconnu@example.com"))))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("inconnu@example.com");

        Event solo = events.add(hackathon.toBuilder().id(null).slug("solo").maxTeamSize(1).build());
        assertThatThrownBy(() -> service.submit(solo.getId(), "awa@example.com", draft(List.of("kofi@example.com"))))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("individuels");
    }

    @Test
    @DisplayName("nobody sits on two projects of the same event")
    void oneProjectPerPerson() {
        service.submit(hackathon.getId(), "awa@example.com", draft(List.of("kofi@example.com")));

        assertThatThrownBy(() -> service.submit(hackathon.getId(), "binta@example.com", draft(List.of("kofi@example.com"))))
                .isInstanceOf(ConflictException.class).hasMessageContaining("Kofi");
    }

    @Test
    @DisplayName("only the owner edits the project, and only until the review starts")
    void onlyTheOwnerEditsBeforeReview() {
        SubmissionView first = service.submit(hackathon.getId(), "awa@example.com", draft(List.of("kofi@example.com")));

        assertThatThrownBy(() -> service.submit(hackathon.getId(), "kofi@example.com", draft(List.of())))
                .isInstanceOf(ConflictException.class);

        service.submit(hackathon.getId(), "awa@example.com", draft(List.of()));
        assertThat(submissions.stored(first.submission().getId()).getMemberIds()).containsExactly(1L);

        service.review(first.submission().getId(), new ProjectReview(SubmissionStatus.UNDER_REVIEW, null, null, null));
        assertThatThrownBy(() -> service.submit(hackathon.getId(), "awa@example.com", draft(List.of())))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("revue");
    }

    @Test
    @DisplayName("the review sets status, score and rank, and refuses a score past 100")
    void reviews() {
        Long id = service.submit(hackathon.getId(), "awa@example.com", draft(List.of())).submission().getId();

        service.review(id, new ProjectReview(SubmissionStatus.ACCEPTED, 87, 1, "  Bravo  "));

        Submission stored = submissions.stored(id);
        assertThat(stored.getStatus()).isEqualTo(SubmissionStatus.ACCEPTED);
        assertThat(stored.getScore()).isEqualTo(87);
        assertThat(stored.getRank()).isEqualTo(1);
        assertThat(stored.getReviewNote()).isEqualTo("Bravo");
        assertThatThrownBy(() -> service.review(id, new ProjectReview(null, 101, null, null))).isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("the admin list reads every team of the event in one member lookup")
    void listsEveryTeamAtOnce() {
        service.submit(hackathon.getId(), "awa@example.com", draft(List.of("kofi@example.com")));
        service.submit(hackathon.getId(), "binta@example.com", draft(List.of()));
        people.lookups.clear();

        List<SubmissionView> views = service.listForEvent(hackathon.getId());

        assertThat(views).hasSize(2);
        assertThat(people.lookups).hasSize(1);
        assertThat(views.get(0).team()).extracting(Member::getFirstName).containsExactly("Awa", "Kofi");
    }
}
