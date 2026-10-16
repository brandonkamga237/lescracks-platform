package com.brandonkamga.lescracks.mail.domain;

import java.time.Instant;

/** A new event, sent to newsletter subscribers. {@code path} is the site path of its page. */
public record EventAnnouncement(String to, String title, String description, String path,
                                String coverImage, Instant startsAt) implements Email {
}
