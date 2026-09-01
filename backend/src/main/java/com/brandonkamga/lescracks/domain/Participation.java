package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.Instant;
import java.util.Optional;

/**
 * One person following one programme.
 *
 * A link rather than a profile, which is what lets somebody hold several: a bootcamp, then a
 * workshop, then the 360. The learner row this replaces allowed exactly one per person.
 *
 * A null {@code event} means Accompagnement 360; a set one means that bootcamp or workshop.
 * Applications already draw the line the same way.
 */
@Entity
@Table(name = "participations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Participation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Null for the Accompagnement 360, which is not an event. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    /** The request this came from, when it came from one. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    private Application application;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ParticipationStatus status = ParticipationStatus.IN_PROGRESS;

    @Column(length = 100)
    private String cohort;

    @Column(name = "started_at")
    private LocalDate startedAt;

    @Column(name = "completed_at")
    private LocalDate completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @OneToOne(mappedBy = "participation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Attestation attestation;

    /** What the person followed, in the words the platform uses about it. */
    public String programmeLabel() {
        return event != null ? event.getTitle() : "Accompagnement 360";
    }

    public boolean isCompleted() {
        return status == ParticipationStatus.COMPLETED;
    }

    /**
     * Completing is the only path to an attestation, and it must record when. Keeping the
     * rule here rather than in a controller means no caller can produce a completed
     * participation with no date, which the database would refuse anyway.
     */
    public void complete(LocalDate on) {
        this.status = ParticipationStatus.COMPLETED;
        this.completedAt = on != null ? on : LocalDate.now();
    }

    public void abandon() {
        this.status = ParticipationStatus.ABANDONED;
        this.completedAt = null;
    }

    public Optional<Attestation> attestation() {
        return Optional.ofNullable(attestation);
    }
}
