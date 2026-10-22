package com.brandonkamga.lescracks.event.domain.model;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.scheduling.Schedules;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * A bootcamp, workshop, webinar, conference or hackathon: something created for a date, that
 * happens, and then is past. A start is required; an end is not, plenty of sessions run for an
 * evening and nobody records when they finished.
 */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class Event {
    private Long id;
    private String slug;
    private String title;
    private String description;
    private EventType type;
    private EventFormat format;
    private Instant startDate;
    private Instant endDate;
    private String location;
    private String coverImage;

    @Builder.Default
    private EventStatus status = EventStatus.DRAFT;

    /** Whether the event collects projects on the platform (a hackathon does). */
    private boolean acceptsSubmissions;

    /** How many people one project may name, the person submitting included: 1 to 4. */
    @Builder.Default
    private int maxTeamSize = 1;

    /** Last moment to submit or change a project; without it, the event's end. */
    private Instant submissionDeadline;

    /** Members signed up and not cancelled. Written only by the registration SQL, never by a save. */
    private int registrationCount;

    /** Set on a draft that the scheduler will publish at that time. */
    private Instant scheduledAt;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();

    public boolean isPublished() {
        return status == EventStatus.PUBLISHED;
    }

    /** Submissions close at the deadline, or at the end of the event when there is none. */
    public Instant submissionsCloseAt() {
        return submissionDeadline != null ? submissionDeadline : endDate;
    }

    /** Over once its end, or its start when it has no end, is behind us. */
    public boolean isOver(Instant now) {
        return (endDate != null ? endDate : startDate).isBefore(now);
    }

    public boolean takesProjectsAt(Instant now) {
        Instant closesAt = submissionsCloseAt();
        return isPublished() && acceptsSubmissions && (closesAt == null || !closesAt.isBefore(now));
    }

    public void schedule(Instant start, Instant end) {
        if (end != null && end.isBefore(start)) {
            throw new BadRequestException("La date de fin ne peut pas précéder la date de début.");
        }
        startDate = start;
        endDate = end;
    }

    /** A scheduled event waits as a draft until the scheduler publishes it, which must happen before it starts. */
    public void plan(EventStatus requested, Instant requestedSchedule) {
        scheduledAt = Schedules.check(requestedSchedule, scheduledAt);
        if (scheduledAt != null && !scheduledAt.isBefore(startDate)) {
            throw new BadRequestException("La publication programmée doit précéder le début de l'événement.");
        }
        status = scheduledAt != null || requested == null ? EventStatus.DRAFT : requested;
    }

    /** False when the draft is no longer due: rescheduled, published by hand or deleted meanwhile. */
    public boolean publishOnSchedule(Instant now) {
        if (status != EventStatus.DRAFT || scheduledAt == null || scheduledAt.isAfter(now)) return false;
        status = EventStatus.PUBLISHED;
        scheduledAt = null;
        updatedAt = now;
        return true;
    }

    public String path() {
        return "/evenements/" + (slug == null || slug.isBlank() ? id : slug);
    }
}
