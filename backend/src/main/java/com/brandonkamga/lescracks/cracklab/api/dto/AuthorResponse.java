package com.brandonkamga.lescracks.cracklab.api.dto;

/** How a member appears publicly: first name and last initial, never the email. */
public record AuthorResponse(String displayName, String avatarUrl) {
}
