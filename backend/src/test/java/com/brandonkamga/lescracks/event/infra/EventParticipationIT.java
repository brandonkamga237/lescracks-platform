package com.brandonkamga.lescracks.event.infra;

import com.brandonkamga.lescracks.event.domain.Event;
import com.brandonkamga.lescracks.event.domain.EventFormat;
import com.brandonkamga.lescracks.event.domain.EventRegistration;
import com.brandonkamga.lescracks.event.domain.EventStatus;
import com.brandonkamga.lescracks.event.domain.EventSubmission;
import com.brandonkamga.lescracks.event.domain.EventType;
import com.brandonkamga.lescracks.event.domain.TeamMember;
import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.support.PostgresIT;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Registrations and projects against real PostgreSQL: the constraints the services rely on. */
@Transactional
class EventParticipationIT extends PostgresIT {

    @Autowired private EventRepository events;
    @Autowired private EventRegistrationRepository registrations;
    @Autowired private EventSubmissionRepository submissions;
    @Autowired private UserRepository users;

    private Event hackathon;
    private User awa;
    private User kofi;

    @BeforeEach
    void seed() {
        hackathon = events.saveAndFlush(Event.builder().title("Hackathon test").slug("hackathon-test").description("D")
                .type(EventType.HACKATHON).format(EventFormat.ONLINE).status(EventStatus.PUBLISHED)
                .startDate(Instant.now()).endDate(Instant.now().plus(10, ChronoUnit.DAYS))
                .acceptsSubmissions(true).maxTeamSize(4).build());
        awa = users.saveAndFlush(User.builder().email("awa.it@example.com").firstName("Awa").lastName("D").passwordHash("h").build());
        kofi = users.saveAndFlush(User.builder().email("kofi.it@example.com").firstName("Kofi").lastName("A").passwordHash("h").build());
    }

    private EventSubmission project(User owner, User... team) {
        EventSubmission submission = EventSubmission.builder().event(hackathon).ownerId(owner.getId()).title("P")
                .repositoryUrl("https://github.com/x/y").description("D").build();
        submission.getMembers().add(new TeamMember(owner.getId(), hackathon.getId()));
        for (User member : team) submission.getMembers().add(new TeamMember(member.getId(), hackathon.getId()));
        return submissions.saveAndFlush(submission);
    }

    @Test
    @DisplayName("a member registers once per event, and the counter follows the SQL shifts")
    void registersOncePerEvent() {
        registrations.saveAndFlush(EventRegistration.builder().event(hackathon).userId(awa.getId()).build());
        registrations.shiftRegistrationCount(hackathon.getId(), 1);

        assertThat(events.findById(hackathon.getId())).isPresent();
        assertThat(registrations.findByEventIdAndUserId(hackathon.getId(), awa.getId())).isPresent();
        assertThatThrownBy(() -> registrations.saveAndFlush(EventRegistration.builder().event(hackathon).userId(awa.getId()).build()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("a teammate finds the project, and the database refuses them on a second one")
    void onePersonOneProject() {
        EventSubmission first = project(awa, kofi);

        assertThat(submissions.findByEventAndMember(hackathon.getId(), kofi.getId())).map(EventSubmission::getId).contains(first.getId());
        assertThat(submissions.findForEvent(hackathon.getId())).extracting(EventSubmission::getMembers)
                .first().satisfies(members -> assertThat(members).hasSize(2));
        assertThatThrownBy(() -> project(kofi)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("the schema keeps the team size between 1 and 4")
    void teamSizeIsBounded() {
        hackathon.setMaxTeamSize(5);
        assertThatThrownBy(() -> events.saveAndFlush(hackathon)).isInstanceOf(DataIntegrityViolationException.class);
    }
}
