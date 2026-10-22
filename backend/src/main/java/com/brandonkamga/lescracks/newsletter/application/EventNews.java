package com.brandonkamga.lescracks.newsletter.application;

import java.time.Instant;

/** A newly published event, as subscribers are told about it. {@code path} is the page on the site. */
public record EventNews(String title, String description, String path, String coverImage, Instant startDate) {
}
