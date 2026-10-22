package com.brandonkamga.lescracks.community.domain;

import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.recognition.domain.BadgeService;
import com.brandonkamga.lescracks.recognition.domain.CertificateService;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
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
    public PublicProfile of(Long memberId) {
        Member member = people.require(memberId);
        // Newsletter-only contacts, suspended and banned accounts have no public face.
        if (!member.isActive() || !member.hasLoginMethod()) {
            throw new NotFoundException("Membre", "id", memberId);
        }
        return new PublicProfile(member, badges.badgesOf(memberId), certificates.issuedTo(memberId));
    }
}
