package com.brandonkamga.lescracks.mail.domain;

/** A new resource, sent to newsletter subscribers. {@code path} is the site path of its page. */
public record ResourceAnnouncement(String to, String title, String description, String path,
                                   String coverImage) implements Email {
}
