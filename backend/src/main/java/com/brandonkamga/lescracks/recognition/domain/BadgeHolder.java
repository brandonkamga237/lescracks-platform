package com.brandonkamga.lescracks.recognition.domain;

import com.brandonkamga.lescracks.member.application.Member;

/** Someone holding a badge, for the admin list. */
public record BadgeHolder(MemberBadge award, Member member) {
}
