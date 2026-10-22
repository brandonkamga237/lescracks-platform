package com.brandonkamga.lescracks.community.application;

import com.brandonkamga.lescracks.engagement.application.CommentService;
import com.brandonkamga.lescracks.event.application.RegistrationService;
import com.brandonkamga.lescracks.event.application.SubmissionService;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.recognition.application.BadgeService;
import com.brandonkamga.lescracks.recognition.application.CertificateService;

public class MemberActivityServiceImpl implements MemberActivityService {
    private final MemberDirectory people;
    private final RegistrationService registrations;
    private final SubmissionService submissions;
    private final BadgeService badges;
    private final CertificateService certificates;
    private final CommentService comments;

    public MemberActivityServiceImpl(MemberDirectory people, RegistrationService registrations, SubmissionService submissions,
                                     BadgeService badges, CertificateService certificates, CommentService comments) {
        this.people = people;
        this.registrations = registrations;
        this.submissions = submissions;
        this.badges = badges;
        this.certificates = certificates;
        this.comments = comments;
    }

    @Override
    public MemberActivity view(Long memberId) {
        people.require(memberId);
        return new MemberActivity(registrations.listOf(memberId), submissions.listOf(memberId), badges.listOf(memberId),
                certificates.listIssuedTo(memberId), comments.countWrittenBy(memberId));
    }
}
