package com.brandonkamga.lescracks.mail.domain;

import java.time.Instant;

/**
 * Reminds a member of a rendez-vous they asked about: the day before, or within the hour. The
 * location is a place or, for an online rendez-vous, the link to join.
 */
public record RendezVousReminderEmail(String to, String firstName, String title, String path, Instant startDate,
                                      boolean withinTheHour, String location) implements Email {
}
