package com.brandonkamga.lescracks.community.application;

import com.brandonkamga.lescracks.event.application.MyEvent;
import com.brandonkamga.lescracks.event.domain.model.Submission;
import com.brandonkamga.lescracks.recognition.domain.model.Certificate;
import com.brandonkamga.lescracks.recognition.domain.model.MemberBadge;

import java.util.List;

/** Everything a member did on the platform, for the admin's sheet: events, projects, badges, attestations, comments. */
public record MemberActivity(List<MyEvent> events, List<Submission> projects, List<MemberBadge> badges,
                             List<Certificate> certificates, long comments) {
}
