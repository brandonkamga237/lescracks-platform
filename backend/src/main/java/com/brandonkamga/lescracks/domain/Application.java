package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Someone asking to join: an event when {@code event} is set, the Accompagnement 360 when it
 * is not. The applicant may have no account yet, which is why {@code user} is optional and
 * the contact details are carried on the row.
 */
@Entity
@Table(name = "applications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Null means the Accompagnement 360. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    /** Set once the applicant has an account; a participation later requires one. */
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

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public boolean isForEvent() {
        return event != null;
    }

    /**
     * A decision records when it was taken. Keeping the pair together here means no caller can
     * leave a decided application without a date, which the database refuses anyway.
     */
    public void decide(ApplicationStatus outcome) {
        if (outcome == ApplicationStatus.PENDING) {
            throw new IllegalArgumentException("A decision cannot be PENDING");
        }
        this.status = outcome;
        this.decidedAt = Instant.now();
    }
}
