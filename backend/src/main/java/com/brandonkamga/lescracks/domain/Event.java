package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A bootcamp or a workshop: something created for a date, that happens, and then is past.
 *
 * It has nothing in common with the Accompagnement 360, which is why they share no table.
 * A start is required — an event without one is not scheduled, it is an idea. An end is not:
 * plenty of sessions run for an evening and nobody records when they finished.
 *
 * The lifecycle is read from those dates rather than stored beside them. A status column and
 * a date column describing the same thing drift apart, and the date is the fact.
 */
@Entity
@Table(name = "events")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EventKind kind;

    @Column(nullable = false, unique = true, length = 160)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 500)
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cover_id")
    private Media cover;

    /** Required: an event is defined by when it starts. */
    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    /** Optional: many sessions never record an end, and inventing one would be a lie. */
    @Column(name = "ends_at")
    private Instant endsAt;

    @Column(length = 200)
    private String location;

    /** Null means no limit, which is different from a limit of zero. */
    private Integer capacity;

    @Column(nullable = false)
    @Builder.Default
    private boolean published = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /** When an end was recorded, it bounds the event; otherwise the start does. */
    public Instant effectiveEnd() {
        return endsAt != null ? endsAt : startsAt;
    }

    public boolean isUpcoming() {
        return startsAt.isAfter(Instant.now());
    }

    public boolean isPast() {
        return effectiveEnd().isBefore(Instant.now());
    }

    /** Neither upcoming nor over: the window it is being held in. */
    public boolean isRunning() {
        return !isUpcoming() && !isPast();
    }
}
