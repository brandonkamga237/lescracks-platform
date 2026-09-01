package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Someone asking to join something.
 *
 * What they are asking for is stated by {@link #target}, not left to be worked out from
 * which foreign key happens to be null. When the target is an event, {@link #event} is set;
 * when it is the Accompagnement 360, there is nothing to point at, because the 360 is one
 * permanent thing rather than a row among many.
 *
 * The contact details are carried here because an applicant need not have an account yet:
 * people apply first and register afterwards, and refusing the application until they sign
 * up loses the ones who would have.
 */
@Entity
@Table(name = "applications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EnrolmentTarget target;

    /** Set if and only if the target is an event; the database enforces the pairing. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    /** Filled once the applicant has an account. A participation later requires one. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "full_name", nullable = false, length = 160)
    private String fullName;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(length = 40)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String motivation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.PENDING;

    /** Set when a decision is taken, and only then. */
    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public boolean isPending() {
        return status == ApplicationStatus.PENDING;
    }

    /**
     * Records the decision and when it was taken, together. Keeping the pair here means no
     * caller can leave a decided application undated — which the database would refuse, but
     * refusing at the last moment is a poor way to learn a rule.
     */
    public void decide(ApplicationStatus outcome) {
        if (outcome == null || outcome == ApplicationStatus.PENDING) {
            throw new IllegalArgumentException("A decision is ACCEPTED or REJECTED, never PENDING");
        }
        this.status = outcome;
        this.decidedAt = Instant.now();
    }
}
