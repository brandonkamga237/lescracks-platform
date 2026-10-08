package com.brandonkamga.lescracks.cracklab.api.dto;

/** How a member appears publicly: first name and last initial, never the email. */
/** `id` is the member's public profile id (/cracklab/membres/{id}). */
public record AuthorResponse(Long id, String displayName, String avatarUrl) {
}
