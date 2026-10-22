package com.brandonkamga.lescracks.community.domain;

import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.recognition.domain.Certificate;
import com.brandonkamga.lescracks.recognition.domain.MemberBadge;

import java.util.List;

/** What anyone may see of a member: the person, their badges and their issued attestations. */
public record PublicProfile(User member, List<MemberBadge> badges, List<Certificate> certificates) {
}
