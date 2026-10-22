package com.brandonkamga.lescracks.event.infra.persistence;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.event.application.EventStatistics;
import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventFormat;
import com.brandonkamga.lescracks.event.domain.model.EventSearch;
import com.brandonkamga.lescracks.event.domain.model.EventStatus;
import com.brandonkamga.lescracks.event.domain.model.EventType;
import com.brandonkamga.lescracks.event.domain.model.Registration;
import com.brandonkamga.lescracks.event.domain.model.RegistrationStatus;
import com.brandonkamga.lescracks.event.domain.model.Submission;
import com.brandonkamga.lescracks.event.domain.model.SubmissionStatus;
import com.brandonkamga.lescracks.event.domain.port.EventStore;
import com.brandonkamga.lescracks.event.domain.port.RegistrationStore;
import com.brandonkamga.lescracks.event.domain.port.SubmissionStore;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.support.PostgresIT;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Every statement of event's adapters against PostgreSQL, and the constraints the services rely on. */
@Transactional
class JdbcEventIT extends PostgresIT {

    @Autowired private EventStore events;
    @Autowired private RegistrationStore registrations;
    @Autowired private SubmissionStore submissions;
    @Autowired private EventStatistics statistics;
    @Autowired private AccountStore accounts;

    private final Instant now = Instant.now();
    private Long awa;
    private Long kofi;

    @BeforeEach
    void setUp() {
        awa = accounts.save(Account.builder().email("awa.event@example.com").firstName("Awa").lastName("D").passwordHash("h").build()).getId();
        kofi = accounts.save(Account.builder().email("kofi.event@example.com").firstName("Kofi").lastName("A").passwordHash("h").build()).getId();
    }

    private Event event(String slug, EventStatus status, Instant start, Instant end) {
        return events.save(Event.builder().slug(slug).title("Titre " + slug).description("D").type(EventType.HACKATHON)
                .format(EventFormat.ONLINE).status(status).startDate(start).endDate(end).acceptsSubmissions(true).maxTeamSize(4).build());
    }

    @Test
    @DisplayName("an event round-trips, and a save never overwrites the registration counter")
    void roundTrip() {
        Event saved = event("it-round-trip", EventStatus.DRAFT, now.plus(5, ChronoUnit.DAYS), null);
        registrations.shiftCount(saved.getId(), 2);

        Event loaded = events.findBySlug("it-round-trip").orElseThrow();
        assertThat(loaded.getRegistrationCount()).isEqualTo(2);
        assertThat(loaded.getMaxTeamSize()).isEqualTo(4);
        assertThat(events.slugTaken("it-round-trip")).isTrue();

        loaded.setTitle("Renommé");
        loaded.setRegistrationCount(0);
        events.save(loaded);
        assertThat(events.findById(saved.getId())).get().satisfies(event -> {
            assertThat(event.getTitle()).isEqualTo("Renommé");
            assertThat(event.getRegistrationCount()).isEqualTo(2);
        });
        registrations.shiftCount(saved.getId(), -5);
        assertThat(events.findById(saved.getId())).get().extracting(Event::getRegistrationCount).isEqualTo(0);
    }

    @Test
    @DisplayName("an event that has started but not ended is upcoming, not past; filters and totals hold")
    void searchByTiming() {
        Event running = event("it-running", EventStatus.PUBLISHED, now.minus(1, ChronoUnit.DAYS), now.plus(1, ChronoUnit.DAYS));
        Event next = event("it-next", EventStatus.PUBLISHED, now.plus(2, ChronoUnit.DAYS), null);
        Event over = event("it-over", EventStatus.PUBLISHED, now.minus(5, ChronoUnit.DAYS), null);
        event("it-draft", EventStatus.DRAFT, now.plus(3, ChronoUnit.DAYS), null);

        List<Long> upcoming = events.search(EventSearch.upcoming(), new PageQuery(0, 100), now).items().stream().map(Event::getId).toList();
        assertThat(upcoming).containsSubsequence(running.getId(), next.getId()).doesNotContain(over.getId());
        assertThat(events.search(EventSearch.past(), new PageQuery(0, 100), now).items()).extracting(Event::getId)
                .contains(over.getId()).doesNotContain(running.getId(), next.getId());
        var paged = events.search(EventSearch.published(EventType.HACKATHON, EventFormat.ONLINE), new PageQuery(0, 1), now);
        assertThat(paged.items()).hasSize(1);
        assertThat(paged.total()).isGreaterThanOrEqualTo(3);
        assertThat(events.search(EventSearch.backOffice(), new PageQuery(0, 100), now).items()).extracting(Event::getSlug).contains("it-draft");
    }

    @Test
    @DisplayName("a member registers once per event; their events come latest first")
    void registrations() {
        Event first = event("it-reg-1", EventStatus.PUBLISHED, now.plus(1, ChronoUnit.DAYS), null);
        Event second = event("it-reg-2", EventStatus.PUBLISHED, now.plus(9, ChronoUnit.DAYS), null);
        Registration saved = registrations.save(Registration.builder().eventId(first.getId()).userId(awa).build());
        registrations.save(Registration.builder().eventId(second.getId()).userId(awa).build());

        saved.markAttendance(RegistrationStatus.ATTENDED);
        registrations.save(saved);
        assertThat(registrations.find(first.getId(), awa)).get().extracting(Registration::getStatus).isEqualTo(RegistrationStatus.ATTENDED);
        assertThat(registrations.findActiveByMember(awa)).extracting(Registration::getEventId).containsExactly(second.getId(), first.getId());
        assertThat(registrations.findByEvent(first.getId())).hasSize(1);
        // Last statement: the refused INSERT aborts the surrounding test transaction.
        assertThatThrownBy(() -> registrations.save(Registration.builder().eventId(first.getId()).userId(awa).build()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("a teammate finds the project with its whole team; a member taken elsewhere is reported, and the database refuses them")
    void submissions() {
        Event hackathon = event("it-hack", EventStatus.PUBLISHED, now, now.plus(10, ChronoUnit.DAYS));
        Submission project = submissions.save(Submission.builder().eventId(hackathon.getId()).ownerId(awa).title("P")
                .repositoryUrl("https://github.com/x/y").description("D").memberIds(new LinkedHashSet<>(List.of(awa, kofi))).build());

        assertThat(submissions.findByMember(hackathon.getId(), kofi)).get().satisfies(found -> {
            assertThat(found.getId()).isEqualTo(project.getId());
            assertThat(found.getMemberIds()).containsExactly(awa, kofi);
        });
        assertThat(submissions.findTaken(hackathon.getId(), List.of(kofi), null)).containsExactly(kofi);
        assertThat(submissions.findByUser(kofi)).singleElement().extracting(Submission::getMemberIds)
                .isEqualTo(new LinkedHashSet<>(List.of(awa, kofi)));
        assertThat(submissions.findTaken(hackathon.getId(), List.of(kofi), project.getId())).isEmpty();

        project.setMemberIds(new LinkedHashSet<>(List.of(awa)));
        project.review(SubmissionStatus.ACCEPTED, 90, 1, "Bien");
        submissions.save(project);
        assertThat(submissions.findById(project.getId())).get().satisfies(found -> {
            assertThat(found.getMemberIds()).containsExactly(awa);
            assertThat(found.getRank()).isEqualTo(1);
        });
        assertThat(submissions.findByEvent(hackathon.getId())).hasSize(1);
        assertThatThrownBy(() -> submissions.save(Submission.builder().eventId(hackathon.getId()).ownerId(kofi).title("Q")
                .repositoryUrl("https://github.com/x/z").description("D").memberIds(new LinkedHashSet<>(List.of(kofi, awa))).build()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("the schema keeps the team size between 1 and 4")
    void teamSizeIsBounded() {
        Event event = event("it-size", EventStatus.DRAFT, now.plus(1, ChronoUnit.DAYS), null);
        event.setMaxTeamSize(5);

        assertThatThrownBy(() -> events.save(event)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("the dashboard reads grouped counts, the timing of published events, and events by slug or id")
    void statistics() {
        Instant today = now.truncatedTo(ChronoUnit.DAYS);
        var before = statistics.publishedTiming(now, today);
        Event next = event("it-stat-next", EventStatus.PUBLISHED, now.plus(3, ChronoUnit.DAYS), null);
        event("it-stat-today", EventStatus.PUBLISHED, now.minusSeconds(60), null);
        event("it-stat-old", EventStatus.PUBLISHED, now.minus(40, ChronoUnit.DAYS), null);

        var after = statistics.publishedTiming(now, today);
        assertThat(after.upcoming() - before.upcoming()).isEqualTo(1);
        assertThat(after.ongoing() - before.ongoing()).isEqualTo(1);
        assertThat(after.past() - before.past()).isEqualTo(1);
        assertThat(statistics.eventsByType()).containsKey("HACKATHON");
        assertThat(statistics.eventsByStatus()).containsKey("PUBLISHED");
        assertThat(statistics.eventsByPathKey(List.of("it-stat-old", String.valueOf(next.getId())))).extracting(EventStatistics.EventCard::slug)
                .containsExactlyInAnyOrder("it-stat-old", "it-stat-next");
        assertThat(statistics.publishedStartingBetween(now, now.plus(14, ChronoUnit.DAYS), 50)).extracting(EventStatistics.EventCard::slug)
                .contains("it-stat-next").doesNotContain("it-stat-old");
    }
}
