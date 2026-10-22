package com.brandonkamga.lescracks.event.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * A bootcamp, workshop, webinar or conference: something created for a date,
 * that happens, and then is past.
 *
 * A start is required — an event without one is not scheduled, it is an idea.
 * An end is not: plenty of sessions run for an evening and nobody records when
 * they finished.
 */
@Entity
@Table(name = "events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 220)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EventType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EventFormat format;

    @Column(name = "start_date", nullable = false)
    private Instant startDate;

    @Column(name = "end_date")
    private Instant endDate;

    @Column(length = 200)
    private String location;

    @Column(name = "cover_image", length = 1000)
    private String coverImage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EventStatus status = EventStatus.DRAFT;

    /** Whether the event collects projects on the platform (a hackathon does). */
    @Column(name = "accepts_submissions", nullable = false)
    @Builder.Default
    private boolean acceptsSubmissions = false;

    /** How many people one project may name, the person submitting included: 1 to 4. */
    @Column(name = "max_team_size", nullable = false)
    @Builder.Default
    private int maxTeamSize = 1;

    /** Last moment to submit or change a project; without it, the event's end. */
    @Column(name = "submission_deadline")
    private Instant submissionDeadline;

    /** Members signed up and not cancelled. Written only by the registration SQL, never by a save. */
    @Column(name = "registration_count", nullable = false, insertable = false, updatable = false)
    private int registrationCount;

    /** Set on a draft that the scheduler will publish at that time. */
    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    /** Submissions close at the deadline, or at the end of the event when there is none. */
    public Instant submissionsCloseAt() {
        return submissionDeadline != null ? submissionDeadline : endDate;
    }
}
