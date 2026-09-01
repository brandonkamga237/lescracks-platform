package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

/**
 * One person following one thing: the Accompagnement 360, or a particular event.
 *
 * A link rather than a profile, which is what lets somebody hold several — a workshop, then a
 * bootcamp, then the 360. The model this replaces allowed exactly one per person, so the
 * platform's most engaged participant was the one it could not describe.
 *
 * What is being followed is stated by {@link #target}. A person may follow the same thing
 * again years later; what they cannot do is follow it twice at once.
 */
@Entity
@Table(name = "participations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Participation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Required: an attestation names a person, so a participation must have one. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EnrolmentTarget target;

    /** Set if and only if the target is an event. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    /** Where this came from, when it came from a request rather than an admin's hand. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    private Application application;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ParticipationStatus status = ParticipationStatus.IN_PROGRESS;

    /** A label an admin gives a group, when they run in groups. */
    @Column(length = 100)
    private String cohort;

    @Column(name = "started_at")
    private LocalDate startedAt;

    /** Set when and only when completed. */
    @Column(name = "completed_at")
    private LocalDate completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @OneToOne(mappedBy = "participation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Attestation attestation;

    /** What the person followed, in the words the platform uses about it. */
    public String label() {
        return target == EnrolmentTarget.EVENT && event != null
                ? event.getTitle()
                : "Accompagnement 360";
    }

    public boolean isCompleted() {
        return status == ParticipationStatus.COMPLETED;
    }

    /**
     * Completing is the only route to an attestation, and it must record when. The status and
     * the date move together here so no caller can set one without the other.
     */
    public void complete(LocalDate on) {
        this.status = ParticipationStatus.COMPLETED;
        this.completedAt = on != null ? on : LocalDate.now();
    }

    /** Kept rather than deleted: a count of who was helped means nothing without who stopped. */
    public void abandon() {
        this.status = ParticipationStatus.ABANDONED;
        this.completedAt = null;
    }

    public Optional<Attestation> attestation() {
        return Optional.ofNullable(attestation);
    }
}
