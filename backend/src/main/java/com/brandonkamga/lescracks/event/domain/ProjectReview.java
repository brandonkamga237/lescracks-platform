package com.brandonkamga.lescracks.event.domain;

/** The admin's verdict on a project; empty fields are cleared. */
public record ProjectReview(SubmissionStatus status, Integer score, Integer rank, String note) {
}
