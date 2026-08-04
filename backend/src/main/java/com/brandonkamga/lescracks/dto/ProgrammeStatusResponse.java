package com.brandonkamga.lescracks.dto;

/**
 * Availability of the Accompagnement 360 for the public and admin pages.
 * {@code message} is the raw admin-authored closed message (may be null); the frontends
 * fall back to a default when it is absent and only display it while {@code open} is false.
 */
public record ProgrammeStatusResponse(boolean open, String message) {
}
