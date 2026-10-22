package com.brandonkamga.lescracks.recognition.application;

import java.util.List;

/**
 * A badge given to many members at once: pasted emails, the people of an event (all registered,
 * or only those marked present), or both.
 */
public record BadgeGrant(List<String> emails, Long eventId, boolean presentOnly, String reason) {
}
