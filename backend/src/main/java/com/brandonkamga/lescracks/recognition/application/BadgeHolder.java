package com.brandonkamga.lescracks.recognition.application;

import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.recognition.domain.model.MemberBadge;

/** Someone holding a badge, for the admin list. */
public record BadgeHolder(MemberBadge award, Member member) {
}
