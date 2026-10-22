package com.brandonkamga.lescracks.community.domain;

import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.recognition.domain.Certificate;
import com.brandonkamga.lescracks.recognition.domain.MemberBadge;

import java.util.List;

/** What anyone may see of a member: the person, their badges and their issued attestations. */
public record PublicProfile(Member member, List<MemberBadge> badges, List<Certificate> certificates) {
}
