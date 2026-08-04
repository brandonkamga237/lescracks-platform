package com.brandonkamga.lescracks.dto;

/**
 * Admin toggle for the Accompagnement 360. {@code open} is nullable so a caller may update
 * only the message; {@code message} is set as provided (null clears it).
 */
public record ProgrammeStatusUpdateRequest(Boolean open, String message) {
}
