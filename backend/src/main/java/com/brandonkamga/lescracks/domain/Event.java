package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    /**
     * SEO-friendly public identifier, derived from the title at creation time and
     * kept stable across edits so shared/indexed links never break. The numeric id
     * stays internal (PK/FK) and is never exposed in a public URL. Nullable + unique
     * mirrors the existing Resource.slug convention.
     */
    @Column(name = "slug", unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "event_date", nullable = false)
    private LocalDateTime eventDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column
    private String location;

    @Column(name = "cover_image_url")
    private String coverImageUrl;

    /** Ceiling on registrations. Null means no limit. */
    @Column(name = "max_participants")
    private Integer maxParticipants;

    @Column(name = "application_required", nullable = false)
    private Boolean applicationRequired;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_type_id", nullable = false)
    private EventType eventType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_status_id", nullable = false)
    private EventStatus eventStatus;

    /**
     * The status an event is actually in, worked out from its dates.
     *
     * A hand-picked status is a lie waiting to happen: it is correct on the day
     * someone sets it and wrong the morning after. Deriving it means an event opens
     * and closes on its own, with nothing to maintain and no scheduled job.
     *
     * {@code eventDate} (the start) is mandatory; {@code endDate} is not:
     *   - before the start                    → upcoming
     *   - between start and end               → open
     *   - after the end                       → closed
     *   - no end date: open for the start DAY, closed once that day is over
     *     (a one-day event is over when the day is over, not the instant it began)
     */
    public EventStatusEnum deriveStatus() {
        LocalDateTime now = LocalDateTime.now();

        if (eventDate == null) {
            // Should be impossible (the column is NOT NULL), but never guess a status.
            return eventStatus != null ? eventStatus.getName() : EventStatusEnum.upcoming;
        }

        if (now.isBefore(eventDate)) {
            return EventStatusEnum.upcoming;
        }

        LocalDateTime closesAt = (endDate != null)
                ? endDate
                : eventDate.toLocalDate().atTime(LocalTime.MAX); // end of the start day

        return now.isAfter(closesAt) ? EventStatusEnum.closed : EventStatusEnum.open;
    }

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<Application> applications = new HashSet<>();

    @ManyToMany
    @JoinTable(
        name = "event_tags",
        joinColumns = @JoinColumn(name = "event_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();
}
