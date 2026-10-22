package com.brandonkamga.lescracks.event.domain;

import com.brandonkamga.lescracks.member.application.Member;

import java.time.Instant;
import java.util.List;

/** A project with the people named on it (owner first) and when its event stops taking changes. */
public record SubmissionView(EventSubmission submission, List<Member> team, Instant closesAt) {
}
