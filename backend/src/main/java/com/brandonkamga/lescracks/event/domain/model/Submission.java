package com.brandonkamga.lescracks.event.domain.model;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

/** A project handed in for an event by one member, alone or with up to three teammates. */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class Submission {
    private Long id;
    private Long eventId;

    /** The member who submitted: the only one who may change the project. */
    private Long ownerId;

    private String title;
    private String repositoryUrl;
    private String demoUrl;
    private String description;

    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.SUBMITTED;

    /** 0 to 100, set by the admin. */
    private Integer score;

    /** 1 for the winner, 2 and 3 for the podium; empty for the others. */
    private Integer rank;

    private String reviewNote;

    /** Everyone named on the project, the owner first. */
    @Builder.Default
    private Set<Long> memberIds = new LinkedHashSet<>();

    @Builder.Default
    private Instant submittedAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();

    /** The team may change it until the admin takes it into review. */
    public boolean isOpenToChanges() {
        return status == SubmissionStatus.SUBMITTED;
    }

    /** Empty fields clear what was there; a status left out keeps the current one. */
    public void review(SubmissionStatus verdict, Integer newScore, Integer newRank, String note) {
        if (newScore != null && (newScore < 0 || newScore > 100)) throw new BadRequestException("La note va de 0 à 100.");
        if (newRank != null && (newRank < 1 || newRank > 10)) throw new BadRequestException("Le classement va de 1 à 10.");
        if (verdict != null) status = verdict;
        score = newScore;
        rank = newRank;
        reviewNote = note == null || note.isBlank() ? null : note.trim();
        updatedAt = Instant.now();
    }
}
