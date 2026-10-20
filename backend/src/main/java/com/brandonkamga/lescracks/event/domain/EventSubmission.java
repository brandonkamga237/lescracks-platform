package com.brandonkamga.lescracks.event.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/** A project handed in for an event by one member, alone or with up to three teammates. */
@Entity
@Table(name = "event_submissions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    /** The member who submitted: the only one who may change the project. */
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "repository_url", nullable = false, length = 500)
    private String repositoryUrl;

    @Column(name = "demo_url", length = 500)
    private String demoUrl;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.SUBMITTED;

    /** 0 to 100, set by the admin. */
    private Integer score;

    /** 1 for the winner, 2 and 3 for the podium; empty for the others. */
    @Column(name = "rank")
    private Integer rank;

    @Column(name = "review_note", columnDefinition = "TEXT")
    private String reviewNote;

    /** Everyone named on the project, the owner included. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "event_submission_members", joinColumns = @JoinColumn(name = "submission_id"))
    @Builder.Default
    private Set<TeamMember> members = new HashSet<>();

    @Column(name = "submitted_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant submittedAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
