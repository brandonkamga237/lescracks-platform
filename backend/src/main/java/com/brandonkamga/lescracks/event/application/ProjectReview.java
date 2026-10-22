package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.SubmissionStatus;

/** The admin's verdict on a project; empty fields are cleared. */
public record ProjectReview(SubmissionStatus status, Integer score, Integer rank, String note) {
}
