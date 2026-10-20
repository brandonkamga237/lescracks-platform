package com.brandonkamga.lescracks.recognition.domain;

import com.brandonkamga.lescracks.identity.domain.User;

/** Someone holding a badge, for the admin list. */
public record BadgeHolder(MemberBadge award, User member) {
}
