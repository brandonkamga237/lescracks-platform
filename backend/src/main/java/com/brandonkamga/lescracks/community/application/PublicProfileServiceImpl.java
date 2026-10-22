package com.brandonkamga.lescracks.community.application;

import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.recognition.application.BadgeService;
import com.brandonkamga.lescracks.recognition.application.CertificateService;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

public class PublicProfileServiceImpl implements PublicProfileService {
    private final MemberDirectory people;
    private final BadgeService badges;
    private final CertificateService certificates;

    public PublicProfileServiceImpl(MemberDirectory people, BadgeService badges, CertificateService certificates) {
        this.people = people;
        this.badges = badges;
        this.certificates = certificates;
    }

    @Override
    public PublicProfile require(Long memberId) {
        Member member = people.require(memberId);
        // Suspended and banned accounts have no public face.
        if (!member.isActive()) {
            throw new NotFoundException("Membre", "id", memberId);
        }
        return new PublicProfile(member, badges.listOf(memberId), certificates.listIssuedTo(memberId));
    }
}
