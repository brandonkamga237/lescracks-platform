package com.brandonkamga.lescracks.mail.domain;

/** Sent when the admin gives a member a badge: what it is and where it shows. */
public record BadgeAwardedEmail(String to, String firstName, String badgeName, String badgeDescription, String reason, Long memberId)
        implements Email {
}
