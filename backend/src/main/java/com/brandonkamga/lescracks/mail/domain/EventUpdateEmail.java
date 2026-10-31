package com.brandonkamga.lescracks.mail.domain;

import java.time.Instant;

/** A message from the organisers to someone registered for an event, with its page and deadline. */
public record EventUpdateEmail(String to, String firstName, String eventTitle, String eventPath, String message,
                               Instant submissionsCloseAt) implements Email {
}
